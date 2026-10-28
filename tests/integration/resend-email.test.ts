import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetEmailRateLimitStateForTests,
  sendOperationalSummaryServerOnly,
} from '@/lib/email/resend-service';
import {
  sendRegistrationWelcomeEmail,
  sendPasswordResetCodeEmail,
  sendPasswordChangedNoticeEmail,
} from '@/lib/email/auth-email-service';
import { buildSeedDemoDevices } from '@/fixtures/demo-devices';

describe('Resend Optional P1 Server-Only Operational Summary Service', () => {
  const sampleDevices = buildSeedDemoDevices();
  const managerActor = {
    id: 'mgr-1',
    name: 'Morgan Manager',
    role: 'manager' as const,
  };
  const techActor = {
    id: 'tech-1',
    name: 'Taylor Tech',
    role: 'technician' as const,
  };

  beforeEach(() => {
    resetEmailRateLimitStateForTests();
  });

  it('rejects unauthenticated requests with UNAUTHORIZED', async () => {
    const res = await sendOperationalSummaryServerOnly(
      {
        recipient: 'lead@example.org',
        scope: 'all',
        idempotencyKey: 'idem-unauth-12345',
      },
      {
        actor: null,
        resendApiKey: 're_test_mock_key',
        fromEmail: 'ReuseFlow <updates@example.org>',
        allowlistCsv: 'lead@example.org',
        devices: sampleDevices,
      }
    );

    expect(res).toEqual({
      ok: false,
      code: 'UNAUTHORIZED',
      message: expect.stringContaining('Authentication required'),
    });
  });

  it('rejects non-manager roles (technician/viewer) with FORBIDDEN', async () => {
    const res = await sendOperationalSummaryServerOnly(
      {
        recipient: 'lead@example.org',
        scope: 'all',
        idempotencyKey: 'idem-tech-12345',
      },
      {
        actor: techActor,
        resendApiKey: 're_test_mock_key',
        fromEmail: 'ReuseFlow <updates@example.org>',
        allowlistCsv: 'lead@example.org',
        devices: sampleDevices,
      }
    );

    expect(res).toEqual({
      ok: false,
      code: 'FORBIDDEN',
      message: expect.stringContaining('Only an authorized Refurbishment Manager'),
    });
  });

  it('degrades gracefully with FAILED_DEPENDENCY when RESEND_API_KEY is absent', async () => {
    const res = await sendOperationalSummaryServerOnly(
      {
        recipient: 'lead@example.org',
        scope: 'all',
        idempotencyKey: 'idem-nokey-12345',
      },
      {
        actor: managerActor,
        resendApiKey: '',
        fromEmail: '',
        allowlistCsv: 'lead@example.org',
        devices: sampleDevices,
      }
    );

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('FAILED_DEPENDENCY');
      expect(res.message).toContain('Email notifications not configured');
    }
  });

  it('rejects recipients not present in REPORT_RECIPIENT_ALLOWLIST', async () => {
    const mockSend = vi.fn();
    const res = await sendOperationalSummaryServerOnly(
      {
        recipient: 'external-unapproved@outside.com',
        scope: 'all',
        idempotencyKey: 'idem-unapproved-12345',
      },
      {
        actor: managerActor,
        resendApiKey: 're_test_mock_key',
        fromEmail: 'ReuseFlow <updates@example.org>',
        allowlistCsv: 'lead@example.org, director@example.org',
        devices: sampleDevices,
        sendFn: mockSend,
      }
    );

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('FORBIDDEN');
      expect(res.message).toContain('REPORT_RECIPIENT_ALLOWLIST');
    }
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('sends aggregate summary for approved manager + allowlisted recipient and suppresses duplicate idempotency key', async () => {
    const mockSend = vi.fn().mockResolvedValue({
      data: { id: 'resend-msg-999' },
      error: null,
    });

    const first = await sendOperationalSummaryServerOnly(
      {
        recipient: 'Director@Example.org',
        scope: 'all',
        idempotencyKey: 'idem-weekly-summary-001',
      },
      {
        actor: managerActor,
        resendApiKey: 're_test_mock_key',
        fromEmail: 'ReuseFlow <updates@example.org>',
        allowlistCsv: 'lead@example.org, director@example.org',
        devices: sampleDevices,
        sendFn: mockSend,
      }
    );

    expect(first).toEqual({
      ok: true,
      data: {
        providerId: 'resend-msg-999',
        recipient: 'director@example.org',
      },
    });
    expect(mockSend).toHaveBeenCalledTimes(1);

    // Duplicate send with same idempotencyKey is suppressed
    const duplicate = await sendOperationalSummaryServerOnly(
      {
        recipient: 'Director@Example.org',
        scope: 'all',
        idempotencyKey: 'idem-weekly-summary-001',
      },
      {
        actor: managerActor,
        resendApiKey: 're_test_mock_key',
        fromEmail: 'ReuseFlow <updates@example.org>',
        allowlistCsv: 'lead@example.org, director@example.org',
        devices: sampleDevices,
        sendFn: mockSend,
      }
    );

    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) {
      expect(duplicate.code).toBe('CONFLICT');
    }
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('degrades gracefully for welcome and password reset emails when RESEND_API_KEY is not set', async () => {
    const prevKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    try {
      const welcome = await sendRegistrationWelcomeEmail({
        email: 'newuser@example.org',
        displayName: 'Alex Operator',
        role: 'technician',
        department: 'Intake & Triage',
        jobTitle: 'Refurbishment Technician',
      });
      expect(welcome.ok).toBe(false);
      expect(welcome.message).toContain('RESEND_API_KEY');

      const reset = await sendPasswordResetCodeEmail({
        email: 'newuser@example.org',
        displayName: 'Alex Operator',
        code: '482910',
      });
      expect(reset.ok).toBe(false);
      expect(reset.message).toContain('RESEND_API_KEY');

      const changed = await sendPasswordChangedNoticeEmail({
        email: 'newuser@example.org',
        displayName: 'Alex Operator',
      });
      expect(changed.ok).toBe(false);
    } finally {
      if (prevKey !== undefined) {
        process.env.RESEND_API_KEY = prevKey;
      }
    }
  });
});

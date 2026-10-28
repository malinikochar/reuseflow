import {
  ActionResponse,
  AssessmentRecord,
  Device,
  DeviceFilters,
  EngineConfig,
  WorkflowEvent,
} from '@/types/domain';
import {
  DeviceCreateInput,
  DeviceUpdateIntakeInput,
  TransitionDeviceInput,
  VerifySanitizationInput,
} from '@/lib/validation/schemas';
import { DeviceRepository } from '@/lib/repositories/types';
import {
  assessDeviceServerAction,
  createDeviceServerAction,
  getDeviceServerAction,
  getEngineConfigServerAction,
  listDevicesServerAction,
  transitionDeviceServerAction,
  updateDeviceIntakeServerAction,
  updateEngineConfigServerAction,
  verifySanitizationServerAction,
} from '@/lib/actions/device-actions';

/**
 * Production Supabase Repository adapter.
 * Routes all reads and mutations through authenticated, role-checked Next.js Server Actions.
 */
export class SupabaseDeviceRepository implements DeviceRepository {
  async list(filters?: DeviceFilters): Promise<Device[]> {
    const res = await listDevicesServerAction(filters);
    if (!res.ok) {
      throw new Error(res.message);
    }
    return res.data;
  }

  async get(id: string): Promise<Device | null> {
    const res = await getDeviceServerAction(id);
    if (!res.ok) {
      throw new Error(res.message);
    }
    return res.data;
  }

  async create(input: DeviceCreateInput): Promise<ActionResponse<Device>> {
    return createDeviceServerAction(input);
  }

  async updateIntake(
    id: string,
    input: DeviceUpdateIntakeInput
  ): Promise<ActionResponse<Device>> {
    return updateDeviceIntakeServerAction(id, input);
  }

  async assessDevice(
    id: string
  ): Promise<ActionResponse<{ device: Device; assessment: AssessmentRecord }>> {
    return assessDeviceServerAction(id);
  }

  async transition(
    input: TransitionDeviceInput
  ): Promise<ActionResponse<{ device: Device; event: WorkflowEvent }>> {
    return transitionDeviceServerAction(input);
  }

  async verifySanitization(
    input: VerifySanitizationInput
  ): Promise<ActionResponse<Device>> {
    return verifySanitizationServerAction(input);
  }

  async getEngineConfig(): Promise<EngineConfig> {
    return getEngineConfigServerAction();
  }

  async updateEngineConfig(config: EngineConfig): Promise<ActionResponse<EngineConfig>> {
    return updateEngineConfigServerAction(config);
  }
}

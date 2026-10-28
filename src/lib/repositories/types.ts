import {
  ActionResponse,
  AssessmentRecord,
  Device,
  DeviceFilters,
  EngineConfig,
  UserRole,
  WorkflowEvent,
} from '@/types/domain';
import {
  DeviceCreateInput,
  DeviceUpdateIntakeInput,
  TransitionDeviceInput,
  VerifySanitizationInput,
} from '@/lib/validation/schemas';

export type ActorContext = {
  id: string;
  name: string;
  role: UserRole;
};

export interface DeviceRepository {
  list(filters?: DeviceFilters): Promise<Device[]>;
  get(id: string): Promise<Device | null>;
  create(input: DeviceCreateInput, actor: ActorContext): Promise<ActionResponse<Device>>;
  updateIntake(
    id: string,
    input: DeviceUpdateIntakeInput,
    actor: ActorContext
  ): Promise<ActionResponse<Device>>;
  assessDevice(
    id: string,
    actor: ActorContext,
    customConfig?: EngineConfig
  ): Promise<ActionResponse<{ device: Device; assessment: AssessmentRecord }>>;
  transition(
    input: TransitionDeviceInput,
    actor: ActorContext
  ): Promise<ActionResponse<{ device: Device; event: WorkflowEvent }>>;
  verifySanitization(
    input: VerifySanitizationInput,
    actor: ActorContext
  ): Promise<ActionResponse<Device>>;
  getEngineConfig(): Promise<EngineConfig>;
  updateEngineConfig(
    config: EngineConfig,
    actor: ActorContext
  ): Promise<ActionResponse<EngineConfig>>;
}

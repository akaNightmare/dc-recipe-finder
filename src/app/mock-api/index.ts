import { AcademyMockApi } from 'app/mock-api/apps/academy/api';
import { FileManagerMockApi } from 'app/mock-api/apps/file-manager/api';
import { HelpCenterMockApi } from 'app/mock-api/apps/help-center/api';
import { AuthMockApi } from 'app/mock-api/common/auth/api';
import { NavigationMockApi } from 'app/mock-api/common/navigation/api';
import { UserMockApi } from 'app/mock-api/common/user/api';
import { ActivitiesMockApi } from 'app/mock-api/pages/activities/api';
import { IconsMockApi } from 'app/mock-api/ui/icons/api';

export const mockApiServices = [
    AcademyMockApi,
    ActivitiesMockApi,
    AuthMockApi,
    FileManagerMockApi,
    HelpCenterMockApi,
    IconsMockApi,
    NavigationMockApi,
    UserMockApi,
];

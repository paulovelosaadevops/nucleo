import { apiRequest } from "@/lib/api/api-client";

import type {
  CurrentUser,
  FamilySettings,
  UpdateFamilySettingsRequest,
} from "@/types/settings";

const CURRENT_USER_PATH = "/api/users/me";

const FAMILY_SETTINGS_PATH =
  "/api/settings/family";

type WeekStartDay =
  | "SUNDAY"
  | "MONDAY";

interface FamilySettingsApiResponse {
  id: string;
  familyId: string;
  familyName: string;
  timeZone: string;
  defaultCurrency: string;
  locale: string;
  weekStartDay: WeekStartDay;
  currentUserRole: FamilySettings["currentUserRole"];
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

let cachedFamilySettings:
  | FamilySettingsApiResponse
  | null = null;

function mapFamilySettings(
  response: FamilySettingsApiResponse,
): FamilySettings {
  return {
    name: response.familyName,
    timeZone: response.timeZone,
    currentUserRole:
      response.currentUserRole,
    canManage: response.canManage,
  };
}

async function loadFamilySettingsResponse(): Promise<FamilySettingsApiResponse> {
  const response =
    await apiRequest<FamilySettingsApiResponse>(
      FAMILY_SETTINGS_PATH,
    );

  cachedFamilySettings = response;

  return response;
}

export const settingsService = {
  getCurrentUser(): Promise<CurrentUser> {
    return apiRequest<CurrentUser>(
      CURRENT_USER_PATH,
    );
  },

  async getFamilySettings(): Promise<FamilySettings> {
    const response =
      await loadFamilySettingsResponse();

    return mapFamilySettings(response);
  },

  async updateFamilySettings(
    request: UpdateFamilySettingsRequest,
  ): Promise<FamilySettings> {
    const current =
      cachedFamilySettings
      ?? await loadFamilySettingsResponse();

    const response =
      await apiRequest<FamilySettingsApiResponse>(
        FAMILY_SETTINGS_PATH,
        {
          method: "PUT",
          body: {
            familyName: request.name,
            timeZone: request.timeZone,
            defaultCurrency:
              current.defaultCurrency,
            locale: current.locale,
            weekStartDay:
              current.weekStartDay,
          },
        },
      );

    cachedFamilySettings = response;

    return mapFamilySettings(response);
  },
};
import { API_BASE_URL } from "./api.js";

export interface InstitutionRegistrationPayload {
  institutionName: string;
  collegeCode?: string;
  institutionType: string;
  officialWebsite: string;
  officialEmail: string;
  state: string;
  city: string;
  fullAddress: string;
  affiliationDetails: string;
  approxStudents?: number;
  approxFaculty?: number;
  representativeName: string;
  representativeDesignation: string;
  representativeEmail: string;
  representativePhone: string;
  supportingDocumentUrl?: string;
  declarationAccepted: boolean;
  isUnverifiedManualEntry?: boolean;
}

export interface ApplicationStatusResult {
  referenceId: string;
  institutionName: string;
  institutionType: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";
  domainMatchVerified: boolean;
  publicStatusMessage: string;
  submittedAt: string;
  reviewedAt?: string;
  isActivated: boolean;
  approvedInstitution?: {
    institutionId: string;
    slug: string;
    name: string;
  } | null;
}

export const applicationService = {
  submitApplication: async (payload: InstitutionRegistrationPayload) => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/applications/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (networkErr: any) {
      throw new Error(
        "Unable to connect to the registration server. Please check your connection."
      );
    }

    let data: any = {};
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        throw new Error(
          `Registration service error (Status ${response.status}). Please try again.`
        );
      }
    }

    if (!response.ok) {
      let msg = "Failed to submit institution application.";
      if (typeof data?.message === "string" && data.message.trim()) {
        msg = data.message;
      } else if (typeof data?.error === "string" && data.error.trim()) {
        msg = data.error;
      }
      throw new Error(msg);
    }
    return data;
  },

  checkStatus: async (
    referenceId: string,
    email: string
  ): Promise<{ success: boolean; data: ApplicationStatusResult }> => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/applications/check-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceId, email }),
      });
    } catch (networkErr: any) {
      throw new Error(
        "Unable to connect to the verification server. Please check your connection."
      );
    }

    let data: any = {};
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        throw new Error(
          `Status verification service error (Status ${response.status}). Please try again.`
        );
      }
    }

    if (!response.ok) {
      let msg = "Could not retrieve application status.";
      if (typeof data?.message === "string" && data.message.trim()) {
        msg = data.message;
      } else if (typeof data?.error === "string" && data.error.trim()) {
        msg = data.error;
      }
      throw new Error(msg);
    }
    return data;
  },
};

export default applicationService;

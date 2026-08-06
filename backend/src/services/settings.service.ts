import { SystemSettings } from "../models/settings.model.js";

export class SettingsService {
  static async getSettings() {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        systemName: "KNIT",
        instituteName: "Kamla Nehru Institute of Technology",
        academicYear: "2026-27",
        googleLoginEnabled: true,
        domainRestriction: "@knit.ac.in",
        sessionTimeout: 30,
        anonymousFeedback: true,
        oneSubmissionPerStudent: true,
        autoActivateBasedOnDate: true,
        themeMode: "dark",
        logoUrl: "",
      });
    }
    return settings;
  }

  static async updateSettings(updateData: any) {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    await settings.save();
    return settings;
  }
}

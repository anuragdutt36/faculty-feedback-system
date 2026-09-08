import mongoose from "mongoose";
import { Institution } from "../models/institution.model.js";
import { SystemSettings } from "../models/settings.model.js";
import { SettingsService } from "../services/settings.service.js";
import { PublicInstitutionController } from "../controllers/publicInstitution.controller.js";
import { env } from "../config/env.js";

async function runBrandingIsolationVerification() {
  console.log("================================================================================");
  console.log("🚀 STARTING INSTITUTION BRANDING & ASSET ISOLATION VERIFICATION");
  console.log("================================================================================");

  await mongoose.connect(env.MONGO_URI);
  console.log(" Connected to MongoDB");

  const cleanupSlugs = ["test-brand-a", "test-brand-b"];
  await Institution.deleteMany({ slug: { $in: cleanupSlugs } });
  
  try {
    // 1. Create Institution A & Institution B
    console.log("\n--- Creating Test Institutions A and B ---");
    const instA = await Institution.create({
      institutionId: "INS-TEST-BRAND-A",
      name: "Alpha University of Technology",
      slug: "test-brand-a",
      type: "Autonomous Institute",
      website: "https://alpha.example.ac.in",
      officialEmail: "admin@alpha.example.ac.in",
      status: "active",
      settings: {
        systemName: "Alpha Portal",
        domainRestriction: "@alpha.example.ac.in",
        googleLoginEnabled: true,
        sessionTimeout: 45,
        anonymousFeedback: true,
        themeMode: "dark",
        accentColor: "#1e40af",
        allowPublicStats: true,
      },
    });

    const instB = await Institution.create({
      institutionId: "INS-TEST-BRAND-B",
      name: "Beta Institute of Science",
      slug: "test-brand-b",
      type: "Affiliated College",
      website: "https://beta.example.ac.in",
      officialEmail: "admin@beta.example.ac.in",
      status: "active",
      settings: {
        systemName: "Beta Portal",
        domainRestriction: "@beta.example.ac.in",
        googleLoginEnabled: true,
        sessionTimeout: 30,
        anonymousFeedback: true,
        themeMode: "light",
        accentColor: "#059669",
        allowPublicStats: true,
      },
    });

    console.log(` Institution A created: ${instA.name} (${instA.institutionId}, slug: ${instA.slug})`);
    console.log(` Institution B created: ${instB.name} (${instB.institutionId}, slug: ${instB.slug})`);

    // 2. Set branding for Institution A
    console.log("\n--- Setting Branding for Institution A ---");
    const logoA = "https://res.cloudinary.com/test-cloud/image/upload/v1/institutions/INS-TEST-BRAND-A/logo_111.png";
    const coverA = "https://res.cloudinary.com/test-cloud/image/upload/v1/institutions/INS-TEST-BRAND-A/covers/cover_111.jpg";
    const coverAPublicId = "institutions/INS-TEST-BRAND-A/covers/cover_111";

    await SettingsService.updateSettings(instA._id, {
      logoUrl: logoA,
      campusImageUrl: coverA,
      campusImages: [{ url: coverA, publicId: coverAPublicId, order: 1 }],
      systemName: "Alpha University Portal",
    });

    const settingsA = await SettingsService.getSettings(instA._id);
    if (settingsA.logoUrl !== logoA || settingsA.campusImageUrl !== coverA) {
      throw new Error(`Institution A settings failed to save properly: ${JSON.stringify(settingsA)}`);
    }
    console.log(" PASS: Institution A branding saved successfully.");

    // 3. Verify Institution B starts with clean default branding (0 logo, 0 cover images)
    console.log("\n--- Verifying Institution B Starts with Clean Slate ---");
    const settingsBInitial = await SettingsService.getSettings(instB._id);
    console.log(`Institution B initial logoUrl: "${settingsBInitial.logoUrl}"`);
    console.log(`Institution B initial campusImages count: ${settingsBInitial.campusImages?.length || 0}`);

    if (settingsBInitial.logoUrl !== "" || (settingsBInitial.campusImages && settingsBInitial.campusImages.length > 0)) {
      throw new Error("FAIL: Institution B leaked Institution A's branding on initialization!");
    }
    console.log(" PASS: Institution B starts completely clean with 0 leaked logos or covers.");

    // 4. Upload Institution B Branding
    console.log("\n--- Uploading Branding for Institution B ---");
    const logoB = "https://res.cloudinary.com/test-cloud/image/upload/v1/institutions/INS-TEST-BRAND-B/logo_222.png";
    const coverB = "https://res.cloudinary.com/test-cloud/image/upload/v1/institutions/INS-TEST-BRAND-B/covers/cover_222.jpg";
    const coverBPublicId = "institutions/INS-TEST-BRAND-B/covers/cover_222";

    await SettingsService.updateSettings(instB._id, {
      logoUrl: logoB,
      campusImageUrl: coverB,
      campusImages: [{ url: coverB, publicId: coverBPublicId, order: 1 }],
      systemName: "Beta Institute Portal",
    });

    // 5. Verify Institution A Still Has Logo A and Cover A (No Overwrite!)
    console.log("\n--- Verifying Institution A Retains Branding (No Overwrite by B) ---");
    const settingsAPostB = await SettingsService.getSettings(instA._id);
    if (settingsAPostB.logoUrl !== logoA) {
      throw new Error(`FAIL: Institution A's logo was overwritten! Expected ${logoA}, got ${settingsAPostB.logoUrl}`);
    }
    if (settingsAPostB.campusImageUrl !== coverA) {
      throw new Error(`FAIL: Institution A's cover was overwritten! Expected ${coverA}, got ${settingsAPostB.campusImageUrl}`);
    }
    console.log(" PASS: Institution A branding remained 100% intact after Institution B uploaded branding.");

    // 6. Upload new Logo for Institution A (Logo A_v2)
    console.log("\n--- Updating Institution A Logo to Logo A_v2 ---");
    const logoA_v2 = "https://res.cloudinary.com/test-cloud/image/upload/v1/institutions/INS-TEST-BRAND-A/logo_333.png";
    await SettingsService.updateSettings(instA._id, { logoUrl: logoA_v2 });

    // 7. Verify Institution B Still Has Logo B and Cover B
    console.log("\n--- Verifying Institution B Retains Branding (No Overwrite by A) ---");
    const settingsBPostAUpdate = await SettingsService.getSettings(instB._id);
    if (settingsBPostAUpdate.logoUrl !== logoB) {
      throw new Error(`FAIL: Institution B's logo was altered! Expected ${logoB}, got ${settingsBPostAUpdate.logoUrl}`);
    }
    if (settingsBPostAUpdate.campusImageUrl !== coverB) {
      throw new Error(`FAIL: Institution B's cover was altered! Expected ${coverB}, got ${settingsBPostAUpdate.campusImageUrl}`);
    }
    console.log(" PASS: Institution B branding remained 100% intact after Institution A updated its logo.");

    // 8. Test Public Institution Portal (by slug)
    console.log("\n--- Verifying Public Institution Portal Isolation (by slug) ---");
    const reqMockA: any = { params: { slug: "test-brand-a" } };
    let jsonAData: any = null;
    const resMockA: any = {
      status: () => ({
        json: (d: any) => { jsonAData = d; }
      })
    };
    await PublicInstitutionController.getBySlug(reqMockA, resMockA, () => {});

    if (jsonAData?.data?.logoUrl !== logoA_v2) {
      throw new Error(`FAIL: Public portal for A returned wrong logo: ${jsonAData?.data?.logoUrl}`);
    }

    const reqMockB: any = { params: { slug: "test-brand-b" } };
    let jsonBData: any = null;
    const resMockB: any = {
      status: () => ({
        json: (d: any) => { jsonBData = d; }
      })
    };
    await PublicInstitutionController.getBySlug(reqMockB, resMockB, () => {});

    if (jsonBData?.data?.logoUrl !== logoB) {
      throw new Error(`FAIL: Public portal for B returned wrong logo: ${jsonBData?.data?.logoUrl}`);
    }
    console.log(" PASS: Public institution portals return their respective isolated branding.");

    // 9. Test Un-Scoped Access Protection
    console.log("\n--- Testing Un-Scoped Access Protection ---");
    const unscopedSettings = await SettingsService.getSettings();
    if (unscopedSettings.logoUrl !== "" || unscopedSettings.campusImageUrl !== "") {
      throw new Error("FAIL: Un-scoped getSettings() leaked an institution's branding!");
    }
    console.log(" PASS: Un-scoped getSettings() safely returns neutral default template.");

    let updateFailedAsExpected = false;
    try {
      await SettingsService.updateSettings(undefined, { logoUrl: "hack" });
    } catch (e: any) {
      updateFailedAsExpected = true;
      console.log(` Expected rejection on un-scoped updateSettings: ${e.message}`);
    }
    if (!updateFailedAsExpected) {
      throw new Error("FAIL: Un-scoped updateSettings() was allowed without institutionId!");
    }
    console.log(" PASS: Un-scoped updateSettings() correctly rejected.");

    // 10. Test Deletion & Asset Ownership Protection
    console.log("\n--- Testing Deletion & Asset Ownership Isolation ---");
    await SettingsService.updateSettings(instB._id, { logoUrl: "" });
    const settingsBAfterDelete = await SettingsService.getSettings(instB._id);
    const settingsAAfterBDelete = await SettingsService.getSettings(instA._id);

    if (settingsBAfterDelete.logoUrl !== "") {
      throw new Error("FAIL: Institution B logo was not deleted!");
    }
    if (settingsAAfterBDelete.logoUrl !== logoA_v2) {
      throw new Error(`FAIL: Institution A logo was affected when Institution B deleted its logo! Expected ${logoA_v2}, got ${settingsAAfterBDelete.logoUrl}`);
    }
    console.log(" PASS: Deleting Institution B logo leaves Institution A logo completely untouched.");

  } finally {
    console.log("\n--- Cleaning up temporary test institutions ---");
    await Institution.deleteMany({ slug: { $in: cleanupSlugs } });
    await SystemSettings.deleteMany({});
    await mongoose.disconnect();
  }

  console.log("================================================================================");
  console.log("🎉 ALL INSTITUTION BRANDING ISOLATION TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

runBrandingIsolationVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});

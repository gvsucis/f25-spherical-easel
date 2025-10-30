import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { FillStyle } from "@/types";
import Nodule from "@/plottables/Nodule";

// Mock Firebase Auth
const mockCurrentUser = { uid: "test-user-123" };
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({
    currentUser: mockCurrentUser
  }))
}));

// Mock user preferences utilities
const mockLoadUserPreferences = vi.fn();
const mockSaveUserPreferences = vi.fn();

vi.mock("@/utils/userPreferences", () => ({
  loadUserPreferences: mockLoadUserPreferences,
  saveUserPreferences: mockSaveUserPreferences
}));

// Import after mocking
const { useUserPreferencesStore } = await import("../userPreferences");

describe("userPreferences store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Reset Nodule.globalFillStyle to default
    Nodule.globalFillStyle = FillStyle.NoFill;
  });

  describe("state initialization", () => {
    it("should initialize with null defaultFill", () => {
      const store = useUserPreferencesStore();
      expect(store.defaultFill).toBeNull();
    });

    it("should initialize with loading false", () => {
      const store = useUserPreferencesStore();
      expect(store.loading).toBe(false);
    });
  });

  describe("load function", () => {
    it("should load preferences for current user when no uid provided", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.PlainFill
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(mockLoadUserPreferences).toHaveBeenCalledWith("test-user-123");
      expect(store.defaultFill).toBe(FillStyle.PlainFill);
    });

    it("should load preferences for specific uid when provided", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.ShadeFill
      });

      const store = useUserPreferencesStore();
      await store.load("specific-user-456");

      expect(mockLoadUserPreferences).toHaveBeenCalledWith("specific-user-456");
      expect(store.defaultFill).toBe(FillStyle.ShadeFill);
    });

    it("should set loading state during load operation", async () => {
      let loadingDuringCall = false;
      mockLoadUserPreferences.mockImplementation(async () => {
        const store = useUserPreferencesStore();
        loadingDuringCall = store.loading;
        return { defaultFill: FillStyle.PlainFill };
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(loadingDuringCall).toBe(true);
      expect(store.loading).toBe(false);
    });

    it("should set defaultFill to null when no preferences exist", async () => {
      mockLoadUserPreferences.mockResolvedValue(null);

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.defaultFill).toBeNull();
    });

    it("should apply preference to Nodule.globalFillStyle when loaded", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.PlainFill
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(Nodule.globalFillStyle).toBe(FillStyle.PlainFill);
    });

    it("should not change Nodule.globalFillStyle when defaultFill is null", async () => {
      Nodule.globalFillStyle = FillStyle.ShadeFill;
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: null
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(Nodule.globalFillStyle).toBe(FillStyle.ShadeFill);
    });

    it("should not load when no current user and no uid provided", async () => {
      mockCurrentUser.uid = "";
      const { getAuth } = await import("firebase/auth");
      (getAuth as any).mockReturnValueOnce({ currentUser: null });

      const store = useUserPreferencesStore();
      await store.load();

      expect(mockLoadUserPreferences).not.toHaveBeenCalled();
      mockCurrentUser.uid = "test-user-123"; // Reset for other tests
    });

    it("should handle all FillStyle enum values", async () => {
      const store = useUserPreferencesStore();

      // Test NoFill
      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.NoFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.NoFill);
      expect(Nodule.globalFillStyle).toBe(FillStyle.NoFill);

      // Test PlainFill
      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.PlainFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.PlainFill);
      expect(Nodule.globalFillStyle).toBe(FillStyle.PlainFill);

      // Test ShadeFill
      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.ShadeFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.ShadeFill);
      expect(Nodule.globalFillStyle).toBe(FillStyle.ShadeFill);
    });
  });

  describe("save function", () => {
    it("should save current defaultFill preference", async () => {
      const store = useUserPreferencesStore();
      store.defaultFill = FillStyle.PlainFill;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill
      });
    });

    it("should save null defaultFill value", async () => {
      const store = useUserPreferencesStore();
      store.defaultFill = null;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null
      });
    });

    it("should throw error when not authenticated", async () => {
      mockCurrentUser.uid = "";
      const { getAuth } = await import("firebase/auth");
      (getAuth as any).mockReturnValueOnce({ currentUser: null });

      const store = useUserPreferencesStore();
      store.defaultFill = FillStyle.PlainFill;

      await expect(store.save()).rejects.toThrow("Not authenticated");
      mockCurrentUser.uid = "test-user-123"; // Reset for other tests
    });

    it("should save all FillStyle enum values", async () => {
      const store = useUserPreferencesStore();

      // Test NoFill
      store.defaultFill = FillStyle.NoFill;
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.NoFill
      });

      // Test PlainFill
      store.defaultFill = FillStyle.PlainFill;
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill
      });

      // Test ShadeFill
      store.defaultFill = FillStyle.ShadeFill;
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.ShadeFill
      });
    });
  });

  describe("integration scenarios", () => {
    it("should support load -> modify -> save workflow", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.NoFill
      });

      const store = useUserPreferencesStore();
      
      // Load initial preference
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.NoFill);

      // Modify preference
      store.defaultFill = FillStyle.PlainFill;

      // Save modified preference
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill
      });
    });

    it("should handle multiple loads without conflicts", async () => {
      const store = useUserPreferencesStore();

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.NoFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.NoFill);

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.PlainFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.PlainFill);

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.ShadeFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.ShadeFill);
    });

    it("should maintain preference value between loads and saves", async () => {
      const store = useUserPreferencesStore();

      // Initial load
      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.PlainFill });
      await store.load();

      // Save same value
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill
      });

      // Verify value unchanged
      expect(store.defaultFill).toBe(FillStyle.PlainFill);
    });
  });
});

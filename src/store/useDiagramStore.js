import { create } from "zustand";
import { createDiagramSlice } from "./slices/diagramSlice.js";
import { createStorageSlice } from "./slices/storageSlice.js";
import { createShareSlice } from "./slices/shareSlice.js";
import { createAdminSlice } from "./slices/adminSlice.js";

export const useDiagramStore = create((set, get, store) => ({
  ...createDiagramSlice(set, get, store),
  ...createStorageSlice(set, get, store),
  ...createShareSlice(set, get, store),
  ...createAdminSlice(set, get, store),
}));

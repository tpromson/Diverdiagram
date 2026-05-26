import { describe, it, expect } from "vitest";
import { templates, getTemplateWithIds } from "../src/utils/templatesData.js";

describe("Driver Diagram Templates", () => {
  it("should have all 9 clinical templates from Namyuen Hospital", () => {
    expect(templates).toHaveLength(9);
    
    const ids = templates.map(t => t.id);
    expect(ids).toContain("suicide_prevention");
    expect(ids).toContain("hiv_aids");
    expect(ids).toContain("ckd_care");
    expect(ids).toContain("copd_care");
    expect(ids).toContain("stroke_care");
    expect(ids).toContain("stemi_care");
    expect(ids).toContain("dengue_fever");
    expect(ids).toContain("malaria_care");
    expect(ids).toContain("diabetic_care");
  });

  it("should correctly populate unique IDs for all elements using getTemplateWithIds", () => {
    const template = templates.find(t => t.id === "suicide_prevention");
    expect(template).toBeDefined();

    // Mock ID generator
    let counter = 0;
    const mockUid = () => `mock-uuid-${++counter}`;

    const processed = getTemplateWithIds(template.data, mockUid);

    // Verify purpose is mapped
    expect(processed.purpose.title).toBe("ฆ่าตัวตายสำเร็จ ≤ 6.3 ต่อแสนประชากร");
    
    // Verify primary drivers are mapped and have IDs
    expect(processed.primaryDrivers).toHaveLength(4);
    expect(processed.primaryDrivers[0].id).toBe("mock-uuid-1");
    expect(processed.primaryDrivers[0].title).toBe("การเข้าถึง");

    // Verify secondary drivers have IDs
    expect(processed.primaryDrivers[0].secondaryDrivers).toHaveLength(2);
    expect(processed.primaryDrivers[0].secondaryDrivers[0].id).toBe("mock-uuid-2");
    expect(processed.primaryDrivers[0].secondaryDrivers[0].title).toBe("คัดกรองกลุ่มเสี่ยง");

    // Verify change ideas have IDs
    expect(processed.primaryDrivers[0].secondaryDrivers[0].changeIdeas).toHaveLength(2);
    expect(processed.primaryDrivers[0].secondaryDrivers[0].changeIdeas[0].id).toBe("mock-uuid-3");
    expect(processed.primaryDrivers[0].secondaryDrivers[0].changeIdeas[0].title).toBe("คัดกรองกลุ่มเสี่ยงคลินิกบริการใน รพ./ชุมชน/สถานประกอบการ");
  });
});

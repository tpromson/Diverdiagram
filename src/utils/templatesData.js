// Clinical Driver Diagram Templates from Namyuen Hospital (Scan_Diver.pdf)

export const templates = [
  {
    id: "suicide_prevention",
    titleTh: "แนวทางการป้องกันการฆ่าตัวตาย (Suicide Prevention)",
    titleEn: "Suicide Prevention",
    data: {
      purpose: {
        title: "ฆ่าตัวตายสำเร็จ ≤ 6.3 ต่อแสนประชากร",
        kpi: "อัตราการฆ่าตัวตายสำเร็จ ≤ 6.3 ต่อแสนประชากร"
      },
      primaryDrivers: [
        {
          title: "การเข้าถึง",
          kpi: "",
          secondaryDrivers: [
            {
              title: "คัดกรองกลุ่มเสี่ยง",
              kpi: "",
              changeIdeas: [
                { title: "คัดกรองกลุ่มเสี่ยงคลินิกบริการใน รพ./ชุมชน/สถานประกอบการ", kpi: "" },
                { title: "เจ้าหน้าที่สาธารณสุข/อสม. คัดกรอง จับสัญญาณเตือนฆ่าตัวตาย", kpi: "" }
              ]
            },
            {
              title: "สุขภาพจิตศึกษาเบื้องต้น",
              kpi: "",
              changeIdeas: [
                { title: "การส่งเสริมด้านสุขภาพจิตดี มีสุข ประชาสัมพันธ์/รณรงค์/สื่อ สัญญาณเตือนฆ่าตัวตาย/การจับสัญญาณหลัก 3ส.", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "วินิจฉัย, ถูกต้อง",
          kpi: "",
          secondaryDrivers: [
            {
              title: "คัดกรองเป้าหมายด้วย 8Q หรือ (su-9)",
              kpi: "",
              changeIdeas: [
                { title: "คัดกรองกลุ่มเสี่ยงทุก Visit/ประชาชนกลุ่มเสี่ยง", kpi: "" }
              ]
            },
            {
              title: "ส่งต่อพบแพทย์/DX.",
              kpi: "",
              changeIdeas: [
                { title: "คัดกรองกลุ่มเสี่ยงทุก Visit/ประชาชนกลุ่มเสี่ยง", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "การเฝ้าระวังที่ดี",
          kpi: "",
          secondaryDrivers: [
            {
              title: "บริการจิตเวชเร่งด่วน",
              kpi: "",
              changeIdeas: [
                { title: "นำข้อมูลการระบาดให้ชุมชน ชุมชนมีส่วนร่วมในการแก้ไขปัญหา, สร้างเครือข่ายในการเฝ้าระวังป้องกันการฆ่าตัวตายในพื้นที่", kpi: "" },
                { title: "ฟื้นฟูจิตใจ/เยียวยาผู้ได้รับผลกระทบ", kpi: "" },
                { title: "รณรงค์ปลุกจิตสำนึกในการป้องกันและแก้ไขปัญหายาเสพติด สร้างภูมิคุ้มกันทางจิตใจให้ประชาชน", kpi: "" }
              ]
            },
            {
              title: "การนอน รพ.",
              kpi: "",
              changeIdeas: [
                { title: "นำข้อมูลการระบาดให้ชุมชน ชุมชนมีส่วนร่วมในการแก้ไขปัญหา, สร้างเครือข่ายในการเฝ้าระวังป้องกันการฆ่าตัวตายในพื้นที่", kpi: "" },
                { title: "ฟื้นฟูจิตใจ/เยียวยาผู้ได้รับผลกระทบ", kpi: "" },
                { title: "รณรงค์ปลุกจิตสำนึกในการป้องกันและแก้ไขปัญหายาเสพติด สร้างภูมิคุ้มกันทางจิตใจให้ประชาชน", kpi: "" }
              ]
            },
            {
              title: "ติดตามผู้ป่วยพยายามฆ่าตัวตาย",
              kpi: "",
              changeIdeas: [
                { title: "เยี่ยมผู้ป่วยพยายามทำร้ายตัวเอง 2 wks./1 เดือน/ 3เดือน/ 1ปี", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "การรักษา",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การให้ยาตามมาตรฐาน",
              kpi: "",
              changeIdeas: [
                { title: "รักษาด้วยยาตามพยาธิสภาพของโรค", kpi: "" }
              ]
            },
            {
              title: "จิตบำบัด/ครอบครัวบำบัด",
              kpi: "",
              changeIdeas: []
            },
            {
              title: "Consult จิตเวช/Refer รพ.เฉพาะทาง",
              kpi: "",
              changeIdeas: [
                { title: "ระบบ Consult จิตเวช / สปส.", kpi: "" }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: "hiv_aids",
    titleTh: "แนวทางการดูแลผู้ป่วย HIV/AIDS (HIV/AIDS Care)",
    titleEn: "HIV/AIDS Care",
    data: {
      purpose: {
        title: "อัตราการเสียชีวิตด้วยโรคเอดส์ 0%",
        kpi: "อัตราการเสียชีวิตด้วยโรคเอดส์ = 0%"
      },
      primaryDrivers: [
        {
          title: "การเข้าถึง",
          kpi: "",
          secondaryDrivers: [
            {
              title: "ค้นหา/คัดกรองกลุ่มเสี่ยง",
              kpi: "",
              changeIdeas: [
                { title: "คัดกรองกลุ่มเสี่ยง ได้แก่ กลุ่มชายที่มีเพศสัมพันธ์กับชาย สาวประเภทสอง พนักงานบริการ (ชาย/หญิง) และผู้ใช้สารเสพติดชนิดฉีด โดยใช้กระบวนการ RRTTR (Reach, Recruit, Test, Treat, Retain)", kpi: "" }
              ]
            },
            {
              title: "ให้ความรู้เรื่อง HIV/AIDS&STI",
              kpi: "",
              changeIdeas: [
                { title: "การส่งเสริม ให้ความรู้ การให้บริการป้องกันการติดเชื้อ HIV/AIDS&STI", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "วินิจฉัย, ถูกต้อง",
          kpi: "",
          secondaryDrivers: [
            {
              title: "VCT/ส่งตรวจ Anti-HIV",
              kpi: "",
              changeIdeas: [
                { title: "บริการให้การปรึกษา แก่ผู้ที่มีความเสี่ยง และส่งตรวจหาการติดเชื้อ เพื่อให้ทราบสถานะ หากตรวจพบเชื้อ ให้รีบส่งเข้าสู่ระบบการรักษา หากตรวจไม่พบเชื้อ ให้ทราบถึงวิธีการป้องกันการติดเชื้อ", kpi: "" }
              ]
            },
            {
              title: "ส่งต่อพบแพทย์/DX.",
              kpi: "",
              changeIdeas: [
                { title: "ผู้ป่วยพร้อมเริ่มยาเสร็จพบแพทย์เพื่อพิจารณาเริ่มยา ARV ทันทีทุกระดับ CD4", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "การรักษา",
          kpi: "",
          secondaryDrivers: [
            {
              title: "ลงทะเบียนเข้าสู่ระบบการรักษา",
              kpi: "",
              changeIdeas: [
                { title: "ลงทะเบียนเข้าสู่ระบบการรักษาในโปรแกรม Nap plus", kpi: "" },
                { title: "พัฒนาระบบบริการโดยใช้ 3C model (3C=Empowerment-stigma)", kpi: "" },
                { title: "จัดระบบบริการแบบ One stop service, Differentiated Care, Same Day ART", kpi: "" },
                { title: "ร่วมดูแลผู้ป่วย โดยทีมสหสาขาวิชาชีพ และแกนนำจิตอาสา", kpi: "" },
                { title: "ระบบ Consult รพ.แม่ข่าย รพ.เดชฯ/รพ.สปส.", kpi: "" }
              ]
            },
            {
              title: "ให้ยาต้านไวรัสทุกระดับ CD4",
              kpi: "",
              changeIdeas: [
                { title: "ลงทะเบียนเข้าสู่ระบบการรักษาในโปรแกรม Nap plus", kpi: "" },
                { title: "พัฒนาระบบบริการโดยใช้ 3C model (3C=Empowerment-stigma)", kpi: "" },
                { title: "จัดระบบบริการแบบ One stop service, Differentiated Care, Same Day ART", kpi: "" },
                { title: "ร่วมดูแลผู้ป่วย โดยทีมสหสาขาวิชาชีพ และแกนนำจิตอาสา", kpi: "" },
                { title: "ระบบ Consult รพ.แม่ข่าย รพ.เดชฯ/รพ.สปส.", kpi: "" }
              ]
            },
            {
              title: "ติดตามให้คงอยู่ในระบบการรักษาและรับยาต้านไวรัสอย่างต่อเนื่อง",
              kpi: "",
              changeIdeas: [
                { title: "เยี่ยมผู้ป่วยร่วมกับแกนนำจิตอาสากลุ่มชีวิตก้าวไกล รพ.น้ำยืน", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "การป้องกัน",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การรับยาต้านไวรัสอย่างต่อเนื่อง",
              kpi: "",
              changeIdeas: [
                { title: "รักษาด้วยยาต้านไวรัสอย่างต่อเนื่อง จนกดปริมาณเชื้อไวรัสในเลือดได้ดี (ผลตรวจ VL < 50 copies/ml)", kpi: "" }
              ]
            },
            {
              title: "ให้ความรู้การป้องกันการแพร่เชื้อ",
              kpi: "",
              changeIdeas: [
                { title: "บริการให้คำปรึกษา เพื่อนช่วยเพื่อน โดยแกนนำจิตอาสา กลุ่มชีวิตก้าวไกล", kpi: "" }
              ]
            },
            {
              title: "ให้ความรู้เรื่องการปฏิบัติตัวและป้องกันโรคติดเชื้อฉวยโอกาส",
              kpi: "",
              changeIdeas: [
                { title: "บริการให้คำปรึกษา เพื่อนช่วยเพื่อน โดยแกนนำจิตอาสา กลุ่มชีวิตก้าวไกล", kpi: "" }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: "ckd_care",
    titleTh: "แนวทางการชะลอไตเสื่อม CKD (Chronic Kidney Disease)",
    titleEn: "CKD Care Plan",
    data: {
      purpose: {
        title: "ชะลอไตเสื่อมระยะ 3-4 ระยะที่ 5 เข้าถึง RRT",
        kpi: "Indicator: HbA1c 6.5-7.5%\n80 % coverage ตรวจประจำปี"
      },
      primaryDrivers: [
        {
          title: "Early detection",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การ Screening diagnosis:IC10",
              kpi: "",
              changeIdeas: [
                { title: "การคัดกรองภาวะไตเสื่อมในกลุ่ม DMHT เป้า 60%", kpi: "" },
                { title: "ปรับเปลี่ยนพฤติกรรม 3อ2ส และการเสริมสร้างแรงจูงใจ", kpi: "" },
                { title: "diagnosis โดยแพทย์และให้รหัสโรคที่ถูกต้อง", kpi: "" },
                { title: "เข้าคลินิกไตเรื้อรังวันอังคาร", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "Treatment",
          kpi: "",
          secondaryDrivers: [
            {
              title: "Drugs, Non-Drugs, CPG for CKD",
              kpi: "",
              changeIdeas: [
                { title: "Health Literacy, Palliative care", kpi: "" },
                { title: "Life style Modification: Case Management, Motivation Interview (MI)", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "Continue of care",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การติดตามผู้ป่วย",
              kpi: "",
              changeIdeas: [
                { title: "นโยบายลดเค็ม ขับเคลื่อน NCD & CKD ผ่าน พชอ.", kpi: "" },
                { title: "ฐานข้อมูลผู้ป่วย-ทีมเยี่ยมบ้าน-การเสริมสร้างแรงจูงใจผู้ป่วยและญาติ ลดหวานมันเค็ม ในบ้าน รร.และชุมชน, ชมรมรักษ์ไต", kpi: "" },
                { title: "ระบบการนัด-การติดตามผู้ป่วย", kpi: "" },
                { title: "เกณฑ์การส่งผู้ป่วยระหว่าง รพ.สต รพ. รพ.แม่ข่าย", kpi: "" },
                { title: "การให้ความรู้ในรูปแบบโรงเรียนรักษ์ไต โดยทีมสหวิชาชีพ", kpi: "" },
                { title: "กิจกรรมพาผู้ป่วยไปเยี่ยมผู้ป่วย CAPD/HD", kpi: "" },
                { title: "เชื่อมกับ Palliative car: family meeting & ACP เพื่อทำตามความประสงค์ของผู้ป่วยในวาระสุดท้ายของชีวิต", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "เฝ้าระวัง complications",
          kpi: "",
          secondaryDrivers: [
            {
              title: "LAB CKD ประจำปีและตรวจ Cr. ซ้ำในไตรมาส 3 การคัดกรอง ตา ไต เท้า ฟันประจำปีกรณี DM ร่วม",
              kpi: "",
              changeIdeas: [
                { title: "HbA1c, Creatinin, eGFR, cal & Phosphorus, electrolyte, CBC", kpi: "" },
                { title: "ได้รับยา Phosphate binder, ACEI/ARB ใน CKD 1-4", kpi: "" },
                { title: "ปิงปองจราจรชีวิต 7 สี", kpi: "" },
                { title: "CKD turn stage # Indicator: % การปรับยาเมื่อมีข้อบ่งชี้", kpi: "" }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: "copd_care",
    titleTh: "แนวทางการดูแลผู้ป่วย COPD (COPD Care)",
    titleEn: "COPD Care Plan",
    data: {
      purpose: {
        title: "ลดการเกิด Exacerbation",
        kpi: "ลดจำนวนครั้งการเกิด Exacerbation ของผู้ป่วย COPD"
      },
      primaryDrivers: [
        {
          title: "วินิจฉัยถูกต้อง",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การคัดกรอง",
              kpi: "",
              changeIdeas: [
                { title: "CXR, Spirometer", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "จัดตั้งคลินิก COPD ที่ได้มาตรฐาน",
          kpi: "",
          secondaryDrivers: [
            {
              title: "Spirometer, ประเมินการใช้ยาพ่น 100%, ประเมิน 6MWT, MMRC, CAT SCORE, คลินิกเลิกบุหรี่",
              kpi: "",
              changeIdeas: []
            }
          ]
        },
        {
          title: "การรักษาครอบคลุม",
          kpi: "",
          secondaryDrivers: [
            {
              title: "CPG การรักษา, vaccine ไข้หวัดใหญ่",
              kpi: "",
              changeIdeas: []
            }
          ]
        },
        {
          title: "การดูแลต่อเนื่อง / ฟื้นฟู",
          kpi: "",
          secondaryDrivers: [
            {
              title: "เยี่ยมบ้านประเมินสิ่งแวดล้อม, นวัตกรรม, ระบบการนัดติดตามผู้ป่วยที่ขาดนัด, การคืนข้อมูลให้กับชุมชน",
              kpi: "",
              changeIdeas: []
            }
          ]
        }
      ]
    }
  },
  {
    id: "stroke_care",
    titleTh: "แนวทางการดูแลผู้ป่วยโรคหลอดเลือดสมอง (Stroke Care)",
    titleEn: "Stroke Care Plan",
    data: {
      purpose: {
        title: "ลดอัตราการตายและพิการ จากโรคหลอดเลือดสมองขาดเลือด",
        kpi: "อัตราการเสียชีวิตจากโรคหลอดเลือดสมองขาดเลือดลดลง"
      },
      primaryDrivers: [
        {
          title: "เข้าถึงเร็ว ค้นหาได้เร็ว",
          kpi: "",
          secondaryDrivers: [
            {
              title: "ความรู้",
              kpi: "",
              changeIdeas: [
                { title: "ไวนิลให้ความรู้ภายในโรงพยาบาล, รพ.สต. และ Spot ให้ความรู้ในชุมชน, กิจกรรมให้ความรู้ใน NCD Clinic", kpi: "" }
              ]
            },
            {
              title: "การคัดกรอง",
              kpi: "",
              changeIdeas: [
                { title: "ใช้แบบคัดกรอง FAST ที่จุดคัดกรอง หากมีอาการที่เข้ากับโรค ส่งเข้า ER ทุกราย", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "วินิจฉัยเร็ว ถูกต้อง",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การซักประวัติ และตรวจ Lab: Electrolyte",
              kpi: "",
              changeIdeas: [
                { title: "ซักประวัติอาการแขนขาอ่อนแรง", kpi: "" },
                { title: "ตรวจ Lab ทุกรายที่มีอาการ เพื่อแยกจาก Hypokalemia", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "รักษาเร็ว",
          kpi: "",
          secondaryDrivers: [
            {
              title: "Refer",
              kpi: "",
              changeIdeas: [
                { title: "กำหนด lab stroke และการประกันเวลาสำหรับส่งต่อ", kpi: "" },
                { title: "ประสานศูนย์ประสานส่งต่อเพิ่มเข้า Stroke Fast track ที่มารับบริการภายในเวลา 4 ชั่วโมงหลังเกิดอาการ", kpi: "" }
              ]
            },
            {
              title: "Rehabilitation",
              kpi: "",
              changeIdeas: [
                { title: "ได้รับคำแนะนำการปฏิบัติตัวที่เหมาะสมก่อนจำหน่าย", kpi: "" },
                { title: "มีการประเมินการกลืน และการฟื้นฟูสมรรถภาพ", kpi: "" },
                { title: "ประสานกายภาพบำบัดเพื่อฟื้นฟูสมรรถภาพ", kpi: "" },
                { title: "ติดต่อประสานงานสหวิชาชีพ และชุมชนเพื่อการดูแลต่อ", kpi: "" }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: "stemi_care",
    titleTh: "แนวทางการดูแลผู้ป่วยโรคหัวใจขาดเลือด STEMI (STEMI Care)",
    titleEn: "STEMI Care Plan",
    data: {
      purpose: {
        title: "ลดอัตราการตายจากโรคหัวใจขาดเลือด",
        kpi: "Door to EKG < 10 นาที\nDoor to drug < 30 นาที\nDoor to refer < 60 นาที"
      },
      primaryDrivers: [
        {
          title: "เข้าถึงเร็ว ค้นหาได้เร็ว",
          kpi: "",
          secondaryDrivers: [
            {
              title: "ความรู้",
              kpi: "",
              changeIdeas: [
                { title: "ไวนิลให้ความรู้ภายในโรงพยาบาล, รพ.สต. และ Spot ให้ความรู้ในชุมชน, กิจกรรมให้ความรู้ใน NCD Clinic", kpi: "" }
              ]
            },
            {
              title: "การคัดกรอง",
              kpi: "",
              changeIdeas: [
                { title: "แบบคัดกรอง Check pain check risk", kpi: "" },
                { title: "การทำ EKG 12 Lead", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "วินิจฉัยเร็ว ถูกต้อง",
          kpi: "",
          secondaryDrivers: [
            {
              title: "ตรวจ Lab: Trop-I",
              kpi: "",
              changeIdeas: [
                { title: "ตรวจทุกรายที่มีอาการเจ็บแน่นหน้าอก เจ็บร้าวไปแขน กราม หลัง เจ็บเหมือนมีอะไรมากดทับ เจ็บมากขึ้นเมื่อมีกิจกรรม และดีขึ้นเมื่อพัก", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "รักษาเร็ว",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การให้ยาตามมาตรฐานและแผนการรักษา",
              kpi: "",
              changeIdeas: [
                { title: "การให้ยา SK หลัง Consult แพทย์เฉพาะทาง CCU", kpi: "" }
              ]
            },
            {
              title: "Refer",
              kpi: "",
              changeIdeas: [
                { title: "ประกันเวลาสำหรับส่งต่อ", kpi: "" },
                { title: "ประสานศูนย์ประสานส่งต่อเพื่อเข้า Fast track MI: CCU", kpi: "" }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: "dengue_fever",
    titleTh: "แนวทางการดูแลผู้ป่วยไข้เลือดออก (Dengue Fever Care)",
    titleEn: "Dengue Fever Care",
    data: {
      purpose: {
        title: "ผู้ป่วยไม่เสียชีวิต",
        kpi: "อัตราการเสียชีวิตจากไข้เลือดออก = 0%"
      },
      primaryDrivers: [
        {
          title: "1. การเข้าถึงเร็ว",
          kpi: "",
          secondaryDrivers: [
            {
              title: "ความรู้เรื่องโรค",
              kpi: "",
              changeIdeas: [
                { title: "ประชาสัมพันธ์ ป้ายรณรงค์", kpi: "" },
                { title: "แผ่นพับสุขศึกษา หอกระจายข่าว", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "2. วินิจฉัยเร็ว ถูกต้อง",
          kpi: "",
          secondaryDrivers: [
            {
              title: "Dengue Conner",
              kpi: "",
              changeIdeas: [
                { title: "TT ทุกรายที่ไข้ + พยาบาลคลำ PR ด้วยมือ วัด BP ด้วย manual ทุกราย", kpi: "" },
                { title: "Dengue check list", kpi: "" },
                { title: "ซักประวัติกลุ่มเสี่ยง/พื้นที่ระบาด", kpi: "" }
              ]
            },
            {
              title: "Investigation: Hct CBC NS1Ag LFT CXR",
              kpi: "",
              changeIdeas: [
                { title: "ติดตาม Lab ตาม Order", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "3. การเฝ้าระวังที่ดี",
          kpi: "",
          secondaryDrivers: [
            {
              title: "Zoning",
              kpi: "",
              changeIdeas: [
                { title: "ดูแลตามระยะของไข้", kpi: "" },
                { title: "Warning signs", kpi: "" },
                { title: "fusion pump control", kpi: "" },
                { title: "ปฏิบัติตาม CPG", kpi: "" },
                { title: "DF DHF record", kpi: "" },
                { title: "I/O", kpi: "" }
              ]
            },
            {
              title: "ดูแลตามระยะขณะอยู่ รพ.",
              kpi: "",
              changeIdeas: [
                { title: "ให้ข้อมูลแผนการรักษา อาการผิดปกติที่ต้องแจ้งเจ้าหน้าที่ เช่น ปวดท้อง อาเจียน มีเลือดออก ถ่ายดำ มีประจำเดือน ให้กำลังใจ ตอบข้อซักถาม", kpi: "" }
              ]
            },
            {
              title: "การตรวจเยี่ยมพื้นที่ระบาด",
              kpi: "",
              changeIdeas: [
                { title: "แจ้งฝ่ายควบคุมโรคทุกราย", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "4. การรักษา",
          kpi: "",
          secondaryDrivers: [
            {
              title: "รักษาถูกต้อง",
              kpi: "",
              changeIdeas: [
                { title: "ให้ IV/ยาถูกต้อง (เตรียม Albumin Dextran)", kpi: "" },
                { title: "standing order DF DHF", kpi: "" }
              ]
            },
            {
              title: "ส่งต่อที่เหมาะสม",
              kpi: "",
              changeIdeas: [
                { title: "Consult Staff ID โรคติดเชื้อไข้เลือดออก 24 ชั่วโมง", kpi: "" }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: "malaria_care",
    titleTh: "แนวทางการดูแลผู้ป่วยมาลาเรีย (Malaria Care)",
    titleEn: "Malaria Care Plan",
    data: {
      purpose: {
        title: "อัตราการเสียชีวิต 0%",
        kpi: "อัตราการเสียชีวิตจากไข้มาลาเรีย = 0%"
      },
      primaryDrivers: [
        {
          title: "การเข้าถึงเร็ว",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การให้ความรู้",
              kpi: "",
              changeIdeas: [
                { title: "แนะนำการสังเกตอาการ ประชาสัมพันธ์ ติดป้ายรณรงค์ แจกแผ่นพับให้ความรู้", kpi: "" }
              ]
            },
            {
              title: "ตรวจคัดกรอง",
              kpi: "",
              changeIdeas: [
                { title: "คัดกรองอาการ ไข้สูงหนาวสั่น เข้าป่าในพื้นที่เสี่ยงมาลาเรีย", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "การวินิจฉัยเร็วและถูกต้อง",
          kpi: "",
          secondaryDrivers: [
            {
              title: "ตรวจ LAB CBC Malaria",
              kpi: "",
              changeIdeas: [
                { title: "ตรวจทุกรายที่มาด้วยไข้สูง หนาวสั่น และมีประวัติเข้าป่า", kpi: "" },
                { title: "ผู้ป่วยที่มาจากพื้นที่โซนระบาดของมาลาเรีย", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "การดูแลและการรักษา",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การให้ยาและการดูแลตาม CPG",
              kpi: "",
              changeIdeas: [
                { title: "ติดตาม DTX, LPT, CBC Malaria ให้ยาตามเชื้อที่เจอ ให้สารน้ำทุกราย", kpi: "" },
                { title: "อัตราการนอน รพ. 100%", kpi: "" }
              ]
            },
            {
              title: "การปรึกษาเมื่อมีอาการผิดปกติ",
              kpi: "",
              changeIdeas: [
                { title: "ระบบ Consult Refer รพ. สปส.", kpi: "" },
                { title: "ภาวะแทรกซ้อน, ภาวะ Shock Cerebral malaria 0%", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "การเฝ้าระวังที่ดี",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การดูแลขณะนอน รพ.",
              kpi: "",
              changeIdeas: [
                { title: "การจัด Zone นอนกางมุ้ง ให้กำลังใจผู้ป่วย,ญาติ", kpi: "" },
                { title: "D/C เมื่อตรวจไม่พบเชื้อ นัด F/U ต่อเนื่อง", kpi: "" }
              ]
            },
            {
              title: "การเยี่ยมพื้นที่",
              kpi: "",
              changeIdeas: [
                { title: "แจ้งฝ่ายควบคุมโรคทุกราย แจ้งพื้นที่ รพสต. ออกเยี่ยม", kpi: "" },
                { title: "พ่นทำลายลูกน้ำภายใน 7 วัน", kpi: "" }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: "diabetic_care",
    titleTh: "แนวทางการดูแลผู้ป่วยเบาหวาน (Diabetic Care)",
    titleEn: "Diabetic Care Plan",
    data: {
      purpose: {
        title: "Control ได้",
        kpi: "Indicator: HbA1c < 7%"
      },
      primaryDrivers: [
        {
          title: "Early detection",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การ Screening, diagnosis",
              kpi: "",
              changeIdeas: [
                { title: "การคัดกรองกลุ่มเสี่ยงอายุ >30 ปีเปลี่ยนพฤติกรรม 3อ2ส", kpi: "" },
                { title: "diagnosis ครั้งแรกที่ รพ.น้ำยืนทุกราย", kpi: "" },
                { title: "เข้าคลินิกเบาหวาน", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "Treatment",
          kpi: "",
          secondaryDrivers: [
            {
              title: "Drugs, Non-Drugs, CPG for DM",
              kpi: "",
              changeIdeas: [
                { title: "ให้ Health education", kpi: "" },
                { title: "Life style Modification: Case Management, Motivation Interviewing", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "Continue of care",
          kpi: "",
          secondaryDrivers: [
            {
              title: "การติดตามผู้ป่วย",
              kpi: "",
              changeIdeas: [
                { title: "ฐานข้อมูลผู้ป่วย - ทีมเยี่ยมบ้าน", kpi: "" },
                { title: "ระบบการนัด, ระบบตามผู้ป่วยขาดนัด", kpi: "" },
                { title: "เกณฑ์การส่งผู้ป่วยระหว่าง รพ.กับ รพ.สต", kpi: "" },
                { title: "ระบบการส่งแบบโรงเรียนเบาหวาน โดยทีมสหสาขาวิชาชีพ", kpi: "" }
              ]
            }
          ]
        },
        {
          title: "เฝ้าระวัง complications",
          kpi: "",
          secondaryDrivers: [
            {
              title: "LAB NCD ประจำปี การคัดกรอง ตา ไต เท้า ฟันประจำปี",
              kpi: "",
              changeIdeas: [
                { title: "ระดับ HbA1c, CVD risk score, ปิงปองจราจรชีวิต7สี, CKD staging", kpi: "" },
                { title: "Indicator: % การปรับยาเมื่อมีข้อบ่งชี้", kpi: "" }
              ]
            }
          ]
        }
      ]
    }
  }
];

// Helper to populate static template data with fresh, unique UUIDs
export const getTemplateWithIds = (templateData, generateIdFn) => {
  const uid = generateIdFn || (() => crypto.randomUUID());
  
  return {
    purpose: {
      title: templateData.purpose.title || "",
      kpi: templateData.purpose.kpi || ""
    },
    primaryDrivers: (templateData.primaryDrivers || []).map(pd => ({
      id: uid(),
      title: pd.title || "",
      kpi: pd.kpi || "",
      secondaryDrivers: (pd.secondaryDrivers || []).map(sd => ({
        id: uid(),
        title: sd.title || "",
        kpi: sd.kpi || "",
        changeIdeas: (sd.changeIdeas || []).map(ci => ({
          id: uid(),
          title: ci.title || "",
          kpi: ci.kpi || ""
        }))
      }))
    }))
  };
};

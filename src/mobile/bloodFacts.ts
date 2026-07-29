export type BloodFactItem =
  | { kind: 'paragraph'; text: string; strong?: boolean }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'table'; rows: [string, string][] };

export interface BloodFactCategory {
  id: string;
  title: string;
  subtitle: string;
  sectionTitle: string;
  items: BloodFactItem[];
}

export const BLOOD_FACTS: BloodFactCategory[] = [
  {
    id: 'blood-needs',
    title: 'Facts about Blood Needs',
    subtitle: 'Why a steady blood supply matters every day.',
    sectionTitle: 'Facts about Blood Needs',
    items: [
      {
        kind: 'bullets',
        items: [
          'Blood is needed for surgeries, cancer treatment, chronic illnesses, childbirth complications, traumatic injuries and severe blood loss.',
          'The need for blood is constant because red cells, platelets and plasma have limited shelf lives.',
          'Blood and platelets cannot be manufactured; they can only come from eligible donors.',
          'All blood types are needed to maintain a reliable supply for patients.',
          'A single donation can be separated into components and may help more than one patient.',
          'A serious accident victim may require many units of blood.',
        ],
      },
    ],
  },
  {
    id: 'blood-supply',
    title: 'Facts about the Blood Supply',
    subtitle: 'Useful facts about availability and demand.',
    sectionTitle: 'Facts about the blood supply',
    items: [
      {
        kind: 'bullets',
        items: [
          'Blood cannot be manufactured - it can only come from generous donors.',
          'Type O-negative blood red cells can be transfused to patients of all blood types. It is always in great demand and often in short supply.',
          'Type AB-positive plasma can be transfused to patients of all other blood types. AB plasma is also usually in short supply.',
          'Safe blood supply depends on regular voluntary donation and mandatory screening before transfusion.',
        ],
      },
    ],
  },
  {
    id: 'donation-process',
    title: 'Facts about the Blood Donation Process',
    subtitle: 'What usually happens before, during and after donation.',
    sectionTitle: 'Facts about the blood donation process',
    items: [
      {
        kind: 'bullets',
        items: [
          'Donating blood is a safe process. A sterile needle is used only once for each donor and then discarded.',
          'Blood donation is a simple four-step process: registration, medical history and mini-physical, donation and refreshments.',
          "Every blood donor is given a mini-physical, checking the donor's temperature, blood pressure, pulse and hemoglobin to ensure it is safe for the donor to give blood.",
          'The actual blood donation typically takes less than 10-12 minutes. The entire process, from the time you arrive to the time you leave, takes about an hour and 15 minutes.',
          'The average adult has about 10 units of blood in the body. Roughly 1 unit is given during a donation.',
          'A healthy donor may donate red blood cells every 56 days, or double red cells every 112 days.',
          'A healthy donor may donate platelets as few as 7 days apart, but a maximum of 24 times a year.',
          'All donated blood is tested for HIV, hepatitis B and C, syphilis and other infectious diseases before it can be transfused to patients.',
        ],
      },
    ],
  },
  {
    id: 'blood-components',
    title: 'Facts about Blood and its Components',
    subtitle: 'What blood is made of and how components help.',
    sectionTitle: 'Facts about blood and its components',
    items: [
      {
        kind: 'bullets',
        items: [
          "Blood makes up about 7 percent of your body's weight.",
          'There are four types of transfusable products that can be derived from blood: red cells, platelets, plasma and cryoprecipitate.',
          'Typically, two or three components are produced from a unit of donated whole blood, so each donation can help save up to three lives.',
          'Donors can give either whole blood or specific blood components only.',
          'The process of donating specific blood components - red cells, plasma or platelets - is called apheresis.',
          'One transfusion dose of platelets can be obtained through one apheresis donation of platelets or by combining platelets derived from five whole blood donations.',
          'Donated platelets must be used within five days of collection.',
          'Healthy bone marrow makes a constant supply of red cells, plasma and platelets. The body replenishes donated elements, some in hours and others in weeks.',
        ],
      },
    ],
  },
  {
    id: 'donors',
    title: 'Facts about Donors',
    subtitle: 'Why donors matter and who their donations help.',
    sectionTitle: 'Facts about donors',
    items: [
      {
        kind: 'bullets',
        items: [
          'The number one reason donors say they give blood is because they want to help others.',
          'Two common reasons cited by people who do not give blood are: never thought about it and I do not like needles.',
          'One donation can help save the lives of up to three people.',
          'If you began donating blood at age 18 and donated every 90 days until you reached 60, you would have donated 30 gallons of blood, potentially helping save more than 500 lives.',
          'O-negative blood type donors are often called universal donors because their red cells can be given to people of all blood types.',
          "Type O-negative blood is needed in emergencies before the patient's blood type is known and with newborns who need blood.",
          'AB-type blood donors are universal donors of plasma, which is often used in emergencies, for newborns and for patients requiring massive transfusions.',
        ],
      },
      {
        kind: 'paragraph',
        text: 'There are four main blood types: A, B, AB and O.',
        strong: true,
      },
      {
        kind: 'paragraph',
        text: 'In 1901, Karl Landsteiner, an Austrian physician, discovered the first three human blood groups. World Blood Donor Day is celebrated on June 14, and National Blood Donation Day is celebrated in India on October 1.',
      },
    ],
  },
  {
    id: 'blood-types-frequency',
    title: 'Frequency of Blood Types',
    subtitle: 'How common each blood type is.',
    sectionTitle: 'Frequency of Blood Types',
    items: [
      {
        kind: 'table',
        rows: [
          ['O+ 1 person in 3', 'O- 1 person in 15'],
          ['A+ 1 person in 3', 'A- 1 person in 16'],
          ['B+ 1 person in 12', 'B- 1 person in 67'],
          ['AB+ 1 person in 29', 'AB- 1 person in 167'],
        ],
      },
    ],
  },
  {
    id: 'blood-use-examples',
    title: 'Examples of Blood Use',
    subtitle: 'Common situations where blood components are used.',
    sectionTitle: 'Examples of Blood Use',
    items: [
      {
        kind: 'table',
        rows: [
          ['Automobile Accident', '50 units of blood'],
          ['Heart Surgery', '6 units of blood / 6 units of platelets'],
          ['Organ Transplant', '40 units of blood / 30 units of platelets'],
          ['20 bags of cryoprecipitate', '25 units of fresh frozen plasma'],
          ['Bone Marrow Transplant', '120 units of platelets / 20 units of blood'],
          ['Burn Victims', '20 units of platelets'],
        ],
      },
    ],
  },
  {
    id: 'who-can-donate',
    title: 'Who Can Donate Blood',
    subtitle: 'Basic health and fitness parameters for donation.',
    sectionTitle: 'Who can donate blood',
    items: [
      {
        kind: 'paragraph',
        text: 'Let others benefit from your good health. Do donate blood if:',
        strong: true,
      },
      {
        kind: 'bullets',
        items: [
          'You are between the age group of 18-60 years.',
          'Your weight is 45 kgs or more.',
          'Your hemoglobin is 12.5 gm% minimum.',
          'Your last blood donation was 3 months earlier.',
          'You are healthy and have not suffered from malaria, typhoid or other transmissible disease in the recent past.',
        ],
      },
      {
        kind: 'paragraph',
        text: 'There are many people who meet these parameters of health and fitness.',
      },
      {
        kind: 'paragraph',
        text: 'Be truthful about your health status during donor screening.',
        strong: true,
      },
      {
        kind: 'paragraph',
        text: 'Collected blood is tested before it is used, and donor health history helps protect both the donor and the patient.',
      },
    ],
  },
  {
    id: 'who-cant-donate',
    title: "Who Can't Donate Blood",
    subtitle: 'Common reasons donation may be deferred.',
    sectionTitle: "Who can't donate blood",
    items: [
      {
        kind: 'paragraph',
        text: 'Do not donate blood if you have any of these conditions:',
        strong: true,
      },
      {
        kind: 'bullets',
        items: [
          'Cold or fever in the past 1 week.',
          'Under treatment with antibiotics or any other medication.',
          'Cardiac problems, hypertension, epilepsy, diabetes on insulin therapy, history of cancer, chronic kidney or liver disease, bleeding tendencies or venereal disease.',
          'Major surgery in the last 6 months.',
          'Vaccination in the last 24 hours.',
          'Miscarriage in the last 6 months, pregnancy or lactation in the last one year.',
          'Fainting attacks during last donation.',
          'Regularly received treatment with blood products.',
          'Shared a needle to inject drugs or have a history of drug addiction.',
          'Sexual relations with different partners or with a high-risk individual.',
          'Tested positive for antibodies to HIV.',
        ],
      },
      {
        kind: 'paragraph',
        text: 'Pregnancy and Menstrual Cycle',
        strong: true,
      },
      {
        kind: 'bullets',
        items: [
          'Females should not donate blood during pregnancy.',
          'They can donate after 6 months following a normal delivery and when they are not breast feeding.',
          'Females should not donate blood if they are having heavy menstrual flow or menstrual cramps.',
        ],
      },
    ],
  },
];

export function getBloodFact(id: string) {
  return BLOOD_FACTS.find((fact) => fact.id === id);
}

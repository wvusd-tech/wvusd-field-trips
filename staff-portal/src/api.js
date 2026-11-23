/**
 * WVUSD Field Trip API Client Service
 * Communicates with the Google Apps Script backend using text/plain JSON requests
 * to avoid CORS preflight blocks, and maintains local mock fallback for preview/demo.
 */

// Default or configured Apps Script Web App URL
export const GAS_API_URL = import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_GAS_API_URL || 
  localStorage.getItem('WVUSD_GAS_API_URL') || 
  "https://script.google.com/macros/s/AKfycbzsHH8CucfdhpVnJw_DCHrQJ2IyHw5DkjxxDrH73fWGkehbGNLIQQDZioafYe8c7JAW/exec";

export function setCustomGasUrl(url) {
  if (url) {
    localStorage.setItem('WVUSD_GAS_API_URL', url.trim());
  } else {
    localStorage.removeItem('WVUSD_GAS_API_URL');
  }
}

/**
 * Universal JSON post helper with Content-Type: text/plain to avoid CORS OPTIONS preflights
 */
async function callGasApi(action, payload = {}, idToken = null) {
  const requestBody = {
    action,
    idToken: idToken || localStorage.getItem('wvusd_id_token') || '',
    ...payload
  };

  try {
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error || 'Server reported failure');
    }

    return json.data;
  } catch (err) {
    console.warn(`[GAS API] Remote call for '${action}' failed (${err.message}). Using local client state fallback.`);
    return handleLocalFallback(action, requestBody);
  }
}

// Pre-populated reference directories for WVUSD
export const WVUSD_SITES = [
  { name: "Castle Rock Elementary", principal: "Elizabeth Chang", principalEmail: "echang@wvusd.org", adminAssistant: "Vanessa Zendejas", adminAssistantEmail: "njohnson@wvusd.org", nurse: "Stephanie Gallegos", nurseEmail: "sgallegos@wvusd.org" },
  { name: "CJ Morris Elementary", principal: "Jennifer Veneracion", principalEmail: "jveneracion@wvusd.org", adminAssistant: "Marilyn Carter", adminAssistantEmail: "mcarter@wvusd.org", nurse: "Nathalie Youssef", nurseEmail: "nyoussef@wvusd.org" },
  { name: "Collegewood Elementary", principal: "Rochelle Wolfe", principalEmail: "jcadena@wvusd.org", adminAssistant: "Cecille Hernandez-Ortiz", adminAssistantEmail: "psiacunco@wvusd.org", nurse: "Carol Lee", nurseEmail: "carollee@wvusd.org" },
  { name: "Evergreen Elementary", principal: "Gabriel Cardenas", principalEmail: "gcardenas@wvusd.org", adminAssistant: "Desiree Gomez", adminAssistantEmail: "desireegomez@wvusd.org", nurse: "Stephanie Gallegos", nurseEmail: "sgallegos@wvusd.org" },
  { name: "Maple Hill Elementary", principal: "Kim McNeil", principalEmail: "kmcneil@wvusd.org", adminAssistant: "Kendra Wilson", adminAssistantEmail: "kperez@wvusd.org", nurse: "Kelly Kim", nurseEmail: "kellykim@wvusd.org" },
  { name: "Quail Summit Elementary", principal: "Nicole Hernandez", principalEmail: "nhernandez@wvusd.org", adminAssistant: "Anna Amezcua", adminAssistantEmail: "aamezcua@wvusd.org", nurse: "Kelly Kim", nurseEmail: "kellykim@wvusd.org" },
  { name: "Vejar Elementary", principal: "Whitney Kosloski", principalEmail: "fweissenberger@wvusd.org", adminAssistant: "Veronica Valenzuela", adminAssistantEmail: "vvalenzuela@wvusd.org", nurse: "Nathalie Youssef", nurseEmail: "dhoac@wvusd.org" },
  { name: "Walnut Elementary", principal: "Robert Chang", principalEmail: "jpak@wvusd.org", adminAssistant: "Julie Charlton", adminAssistantEmail: "mdrain@wvusd.org", nurse: "Donna Lu", nurseEmail: "dhoac@wvusd.org" },
  { name: "Westhoff Elementary", principal: "Rosa Northcott", principalEmail: "rnorthcott@wvusd.org", adminAssistant: "Brittany Dalrymple", adminAssistantEmail: "bDalrymple@wvusd.org", nurse: "Carol Lee", nurseEmail: "carollee@wvusd.org" },
  { name: "Chaparral Middle School", principal: "Robby Jung", principalEmail: "pcruz@wvusd.org", adminAssistant: "Geraldine Munoz", adminAssistantEmail: "gmunoz@wvusd.org", nurse: "Kelly Kim", nurseEmail: "kellykim@wvusd.org" },
  { name: "South Pointe Middle School", principal: "Julie Galindo", principalEmail: "jgalindo@wvusd.org", adminAssistant: "Mary Weir", adminAssistantEmail: "mweir@wvusd.org", nurse: "Stephanie Gallegos", nurseEmail: "sgallegos@wvusd.org" },
  { name: "Suzanne Middle School", principal: "Matt Spinogatti", principalEmail: "mspinogatti@wvusd.org", adminAssistant: "Pia Munoz", adminAssistantEmail: "piamunoz@wvusd.org", nurse: "Nathalie Youssef", nurseEmail: "nyoussef@wvusd.org" },
  { name: "Diamond Bar High School", principal: "YY", principalEmail: "yliew@wvusd.org", adminAssistant: "Cathy Norys", adminAssistantEmail: "cnorys@wvusd.org", nurse: "Theresa Guest", nurseEmail: "tguest@wvusd.org" },
  { name: "Walnut High School", principal: "Jamie Norell", principalEmail: "jnorell@wvusd.org", adminAssistant: "Monique Estrada", adminAssistantEmail: "mestrada@wvusd.org", nurse: "Carol Lee", nurseEmail: "carollee@wvusd.org" },
  { name: "Ron Hockwalt Academies", principal: "Ryan Maine", principalEmail: "asmith@wvusd.org", adminAssistant: "Lissette Chappel", adminAssistantEmail: "lchappel@wvusd.org", nurse: "Donna Lu", nurseEmail: "dhoac@wvusd.org" },
  { name: "HARTT", principal: "Amber Verdi", principalEmail: "averdi@wvusd.org", adminAssistant: "Lissette Chappel", adminAssistantEmail: "lchappel@wvusd.org", nurse: "Donna Lu", nurseEmail: "dhoac@wvusd.org" },
  { name: "Childcare", principal: "Paula Gutierrez", principalEmail: "pgutierrez@wvusd.org", adminAssistant: "Danielle Sarver", adminAssistantEmail: "dsarver@wvusd.org", nurse: "Carol Lee", nurseEmail: "carollee@wvusd.org" },
  { name: "TOTS Preschool", principal: "Erin Perez", principalEmail: "eperez@wvusd.org", adminAssistant: "Janet Rida", adminAssistantEmail: "jrida@wvusd.org", nurse: "Carol Lee", nurseEmail: "carollee@wvusd.org" }
];

export const WVUSD_DEANS = [
  { name: "Luz Lozano", email: "llozano@wvusd.org" },
  { name: "Trina Dreyer", email: "tdreyer@wvusd.org" },
  { name: "Ryan McDonnell", email: "rmcdonnell@wvusd.org" },
  { name: "Gabriel Aguilar", email: "gaguilar@wvusd.org" },
  { name: "Denise Loera", email: "dloera@wvusd.org" },
  { name: "Jennifer Burns", email: "jburns@wvusd.org" },
  { name: "Valerie Varela", email: "vvarela@wvusd.org" },
  { name: "Kurt Davies", email: "kdavies@wvusd.org" }
];

// Pre-loaded realistic sample data for local development & demonstration
let mockTrips = [
  {
    Request_ID: "FT-2026-0042",
    Status: "Under Review",
    Current_Stage: "Site Admin Assistant",
    Submitted_Timestamp: "2026-11-14T09:30:00.000Z",
    Requester_Email: "kwendland@wvusd.org",
    Site: "Diamond Bar High School",
    Dean_Name: "Kurt Davies",
    Dean_Email: "kdavies@wvusd.org",
    Teacher_In_Charge: "Kevin Wendland",
    Co_Teachers_Emails: "mchen@wvusd.org",
    Group_Name: "Science & Astronomy Club",
    Departure_Date: "2026-12-10",
    Departure_Time: "08:00",
    Return_Date: "2026-12-10",
    Return_Time: "16:30",
    Competition_Dates: "",
    Is_Recurring: "No",
    Recurring_Dates: "",
    Destination: "Griffith Observatory & Planetarium",
    Venue_Address: "2800 E Observatory Rd, Los Angeles, CA 90027",
    Trip_Type: "Educational - less than 50 miles",
    Grades: "9th, 10th, 11th, 12th",
    Student_Count: 45,
    Female_Students: 22,
    Male_Students: 23,
    Housing_Provisions: "",
    Roster_File_URL: "https://drive.google.com/open?id=demo_roster_1",
    Teacher_Count: 2,
    Volunteer_Count: 4,
    Female_Volunteers: 2,
    Male_Volunteers: 2,
    Cleared_Volunteers: "Robert Miller, Sarah Lin",
    Board_Approval_Ack: "No",
    Transportation_Type: "School Bus",
    Transport_Details_JSON: JSON.stringify({ schoolBusTF: "TF-2026-881", wheelchairBus: false, boosterSeat: false, safetyVest: false }),
    Activity_Description: "Live planetarium dome show on celestial mechanics, telescope observation, and interactive physics exhibit inquiry.",
    Instructional_Alignment: "Next Generation Science Standards (NGSS) HS-ESS1: Earth's Place in the Universe.",
    Special_Needs_Explanation: "Accessible student gear transport; district health care plan on file for attending students.",
    All_Students_Included: "Yes",
    Supervision_Plan: "1:8 staff-to-student chaperone ratio with assigned check-in zones.",
    Funding_Source: "Science Club ASB",
    Cost_Per_Student: 0,
    Total_Cost: 650,
    Fundraising_Plan: "Funded via team concession sales; all eligible club members travel free.",
    Emergency_Insurance_Prep: "Yes",
    Restart_Ack: "Yes",
    Last_Updated: "2026-11-14T09:30:00.000Z",
    Locked_Boolean: false
  },
  {
    Request_ID: "FT-2026-0038",
    Status: "Action Required (Teacher Edit)",
    Current_Stage: "Transportation",
    Submitted_Timestamp: "2026-11-08T14:15:00.000Z",
    Requester_Email: "kwendland@wvusd.org",
    Site: "Walnut High School",
    Dean_Name: "Valerie Varela",
    Dean_Email: "vvarela@wvusd.org",
    Teacher_In_Charge: "Kevin Wendland",
    Co_Teachers_Emails: "",
    Group_Name: "WHS AP Environmental Science",
    Departure_Date: "2026-12-18",
    Departure_Time: "08:00",
    Return_Date: "2026-12-18",
    Return_Time: "15:00",
    Competition_Dates: "",
    Is_Recurring: "No",
    Recurring_Dates: "",
    Destination: "Bolsa Chica Ecological Wetlands",
    Venue_Address: "18000 CA-1, Huntington Beach, CA 92648",
    Trip_Type: "Educational - less than 50 miles",
    Grades: "11th, 12th",
    Student_Count: 38,
    Female_Students: 0,
    Male_Students: 0,
    Housing_Provisions: "",
    Roster_File_URL: "https://drive.google.com/open?id=demo_roster_2",
    Teacher_Count: 2,
    Volunteer_Count: 3,
    Female_Volunteers: 0,
    Male_Volunteers: 0,
    Cleared_Volunteers: "David Wu",
    Board_Approval_Ack: "No",
    Transportation_Type: "Charter Bus",
    Transport_Details_JSON: JSON.stringify({ charterContacted: "Yes", charterTF: "TF-PENDING-QUOTE" }),
    Activity_Description: "Field study of tidal ecosystems, water quality testing, and wetland biodiversity.",
    Instructional_Alignment: "AP Environmental Science Unit 2: Biodiversity and Aquatic Biomes.",
    Special_Needs_Explanation: "Boardwalk accessibility accommodates all students; medical kit on hand.",
    All_Students_Included: "Yes",
    Supervision_Plan: "Station rotations in groups of 10 with designated chaperone leaders.",
    Funding_Source: "Science Department Budget",
    Cost_Per_Student: 15,
    Total_Cost: 570,
    Fundraising_Plan: "Science club fee sponsorship available; no student denied.",
    Emergency_Insurance_Prep: "Yes",
    Restart_Ack: "Yes",
    Last_Updated: "2026-11-12T11:20:00.000Z",
    Locked_Boolean: false
  },
  {
    Request_ID: "FT-2026-0029",
    Status: "Approved (Complete)",
    Current_Stage: "Operations Director",
    Submitted_Timestamp: "2026-10-20T10:00:00.000Z",
    Requester_Email: "kwendland@wvusd.org",
    Site: "Castle Rock Elementary",
    Dean_Name: "Not Applicable",
    Dean_Email: "",
    Teacher_In_Charge: "Kevin Wendland",
    Co_Teachers_Emails: "vvalenzuela@wvusd.org",
    Group_Name: "4th Grade California History",
    Departure_Date: "2026-11-20",
    Departure_Time: "08:30",
    Return_Date: "2026-11-20",
    Return_Time: "14:30",
    Competition_Dates: "",
    Is_Recurring: "No",
    Recurring_Dates: "",
    Destination: "Mission San Juan Capistrano",
    Venue_Address: "26801 Old Mission Rd, San Juan Capistrano, CA 92675",
    Trip_Type: "Educational - less than 50 miles",
    Grades: "4th",
    Student_Count: 65,
    Female_Students: 32,
    Male_Students: 33,
    Housing_Provisions: "",
    Roster_File_URL: "https://drive.google.com/open?id=demo_roster_3",
    Teacher_Count: 3,
    Volunteer_Count: 8,
    Female_Volunteers: 4,
    Male_Volunteers: 4,
    Cleared_Volunteers: "Robert Miller, Sarah Lin, David Gomez, Amanda White",
    Board_Approval_Ack: "No",
    Transportation_Type: "School Bus",
    Transport_Details_JSON: JSON.stringify({ schoolBusTF: "TF-2026-302", boosterSeat: false, safetyVest: false, wheelchairBus: false }),
    Activity_Description: "Guided docent tour of historic California mission, courtyard museum, and cultural adobe artifacts.",
    Instructional_Alignment: "California Social Studies Standards 4.2 (Spanish Exploration & Colonial Mission Period).",
    Special_Needs_Explanation: "Accessible walkways throughout mission; first aid and student medication accompanied.",
    All_Students_Included: "Yes",
    Supervision_Plan: "1:8 chaperone ratio with color-coded student wristbands.",
    Funding_Source: "Castle Rock Community Club",
    Cost_Per_Student: 0,
    Total_Cost: 1100,
    Fundraising_Plan: "Fully sponsored by Community Club educational fund.",
    Emergency_Insurance_Prep: "Yes",
    Restart_Ack: "Yes",
    Last_Updated: "2026-11-04T16:00:00.000Z",
    Locked_Boolean: true
  },
  {
    Request_ID: "FT-2026-0050",
    Status: "Under Review",
    Current_Stage: "Principal",
    Submitted_Timestamp: "2026-11-16T08:00:00.000Z",
    Requester_Email: "kwendland@wvusd.org",
    Site: "Diamond Bar High School",
    Dean_Name: "Kurt Davies",
    Dean_Email: "kdavies@wvusd.org",
    Teacher_In_Charge: "Kevin Wendland",
    Co_Teachers_Emails: "mchen@wvusd.org",
    Group_Name: "Science Olympiad National Team",
    Departure_Date: "2027-04-15",
    Departure_Time: "06:00",
    Return_Date: "2027-04-19",
    Return_Time: "22:00",
    Competition_Dates: "April 16-18, 2027",
    Is_Recurring: "No",
    Recurring_Dates: "",
    Destination: "Smithsonian & National Science Olympiad - Washington D.C.",
    Venue_Address: "1000 Jefferson Dr SW, Washington, DC 20560",
    Trip_Type: "Out-of-State Field Trip",
    Grades: "10th, 11th, 12th",
    Student_Count: 18,
    Female_Students: 9,
    Male_Students: 9,
    Housing_Provisions: "Marriott Crystal City - separate gender floor blocks",
    Roster_File_URL: "https://drive.google.com/open?id=demo_roster_4",
    Teacher_Count: 2,
    Volunteer_Count: 3,
    Female_Volunteers: 2,
    Male_Volunteers: 1,
    Cleared_Volunteers: "Robert Miller, Sarah Lin, David Gomez",
    Board_Approval_Ack: "Yes",
    Transportation_Type: "Commercial Airline / Rental Van",
    Transport_Details_JSON: JSON.stringify({ airline: "United Airlines", flightConfirmed: true }),
    Activity_Description: "National Science Olympiad Finals competition and educational workshops at Smithsonian Air & Space and Natural History museums.",
    Instructional_Alignment: "Advanced STEM inquiry, national competitive science standards, and physics symposiums.",
    Special_Needs_Explanation: "Full ADA compliance verified; airline medical clearance and travel insurance on file.",
    All_Students_Included: "Yes",
    Supervision_Plan: "1:6 chaperone ratio with 24/7 curfew check-ins and hotel room key monitoring.",
    Funding_Source: "DBHS Academic Boosters & Corporate STEM Grant",
    Cost_Per_Student: 0,
    Total_Cost: 14500,
    Fundraising_Plan: "Fully covered through STEM scholarship endowment; zero student out-of-pocket cost.",
    Emergency_Insurance_Prep: "Yes",
    Restart_Ack: "Yes",
    Last_Updated: "2026-11-16T08:00:00.000Z",
    Locked_Boolean: false
  }
];

let mockLogs = [
  {
    logId: "LOG-101",
    requestId: "FT-2026-0042",
    timestamp: "2026-11-14T09:30:00.000Z",
    actorEmail: "jdoe@wvusd.org",
    actorRole: "Teacher",
    action: "Submitted",
    commentText: "Initial field trip request submitted for CIF Track Invitational.",
    stageFrom: "New",
    stageTo: "Site Admin Assistant"
  },
  {
    logId: "LOG-201",
    requestId: "FT-2026-0038",
    timestamp: "2026-11-08T14:15:00.000Z",
    actorEmail: "jdoe@wvusd.org",
    actorRole: "Teacher",
    action: "Submitted",
    commentText: "Submitted AP Environmental trip.",
    stageFrom: "New",
    stageTo: "Site Admin Assistant"
  },
  {
    logId: "LOG-202",
    requestId: "FT-2026-0038",
    timestamp: "2026-11-09T10:00:00.000Z",
    actorEmail: "mestrada@wvusd.org",
    actorRole: "Site Admin Assistant",
    action: "Approved",
    commentText: "Calendar verified; roster and budget attached.",
    stageFrom: "Site Admin Assistant",
    stageTo: "Dean"
  },
  {
    logId: "LOG-203",
    requestId: "FT-2026-0038",
    timestamp: "2026-11-10T11:30:00.000Z",
    actorEmail: "vvarela@wvusd.org",
    actorRole: "Dean",
    action: "Approved",
    commentText: "Athletic/curricular schedule approved.",
    stageFrom: "Dean",
    stageTo: "Principal"
  },
  {
    logId: "LOG-204",
    requestId: "FT-2026-0038",
    timestamp: "2026-11-11T09:15:00.000Z",
    actorEmail: "jnorell@wvusd.org",
    actorRole: "Principal",
    action: "Approved",
    commentText: "Principal approval granted.",
    stageFrom: "Principal",
    stageTo: "Operations Secretary"
  },
  {
    logId: "LOG-205",
    requestId: "FT-2026-0038",
    timestamp: "2026-11-11T14:00:00.000Z",
    actorEmail: "opssecretary@wvusd.org",
    actorRole: "Operations Secretary",
    action: "Approved",
    commentText: "Verified district requirements.",
    stageFrom: "Operations Secretary",
    stageTo: "Transportation"
  },
  {
    logId: "LOG-206",
    requestId: "FT-2026-0038",
    timestamp: "2026-11-12T11:20:00.000Z",
    actorEmail: "transportation@wvusd.org",
    actorRole: "Transportation",
    action: "Request Changes",
    commentText: "Please update the Charter Bus TF# once you receive the finalized quote from transportation.",
    stageFrom: "Transportation",
    stageTo: "Transportation"
  },
  // Approved trip logs
  {
    logId: "LOG-301",
    requestId: "FT-2026-0029",
    timestamp: "2026-10-20T10:00:00.000Z",
    actorEmail: "jdoe@wvusd.org",
    actorRole: "Teacher",
    action: "Submitted",
    commentText: "4th grade mission trip submitted.",
    stageFrom: "New",
    stageTo: "Site Admin Assistant"
  },
  {
    logId: "LOG-302",
    requestId: "FT-2026-0029",
    timestamp: "2026-10-21T09:00:00.000Z",
    actorEmail: "njohnson@wvusd.org",
    actorRole: "Site Admin Assistant",
    action: "Approved",
    commentText: "Admin assistant signoff.",
    stageFrom: "Site Admin Assistant",
    stageTo: "Principal"
  },
  {
    logId: "LOG-303",
    requestId: "FT-2026-0029",
    timestamp: "2026-10-22T14:00:00.000Z",
    actorEmail: "echang@wvusd.org",
    actorRole: "Principal",
    action: "Approved",
    commentText: "Principal approved.",
    stageFrom: "Principal",
    stageTo: "Operations Secretary"
  },
  {
    logId: "LOG-304",
    requestId: "FT-2026-0029",
    timestamp: "2026-10-25T11:00:00.000Z",
    actorEmail: "opssecretary@wvusd.org",
    actorRole: "Operations Secretary",
    action: "Approved",
    commentText: "Ops secretary approved.",
    stageFrom: "Operations Secretary",
    stageTo: "Transportation"
  },
  {
    logId: "LOG-305",
    requestId: "FT-2026-0029",
    timestamp: "2026-10-28T15:30:00.000Z",
    actorEmail: "transportation@wvusd.org",
    actorRole: "Transportation",
    action: "Approved",
    commentText: "Bus TF-2026-302 confirmed and scheduled.",
    stageFrom: "Transportation",
    stageTo: "HR Personnel"
  },
  {
    logId: "LOG-306",
    requestId: "FT-2026-0029",
    timestamp: "2026-11-01T10:15:00.000Z",
    actorEmail: "hr@wvusd.org",
    actorRole: "HR Personnel",
    action: "Approved",
    commentText: "All 8 parent chaperones have valid fingerprint & Megan's Law clearance.",
    stageFrom: "HR Personnel",
    stageTo: "Operations Director"
  },
  {
    logId: "LOG-307",
    requestId: "FT-2026-0029",
    timestamp: "2026-11-04T16:00:00.000Z",
    actorEmail: "opsdirector@wvusd.org",
    actorRole: "Operations Director",
    action: "Approved",
    commentText: "Final district approval granted. Have a safe and educational trip!",
    stageFrom: "Operations Director",
    stageTo: "Approved"
  }
];

let mockStudents = [
  {
    slipId: "SLIP-STU-001",
    studentId: "10045812",
    studentName: "Ethan Miller",
    assignedTeacher: "Kevin Wendland",
    needsBrunch: "Yes",
    needsLunch: "Yes",
    parentPhone: "(909) 555-0143",
    parentEmail: "rmiller@example.com",
    insuranceBadge: "Verified",
    medicalBadge: "Standard Clearance",
    signedDate: "2026-11-15"
  },
  {
    slipId: "SLIP-STU-002",
    studentId: "10045899",
    studentName: "Chloe Zhang",
    assignedTeacher: "Kevin Wendland",
    needsBrunch: "No",
    needsLunch: "Yes",
    parentPhone: "(909) 555-0199",
    parentEmail: "slin@example.com",
    insuranceBadge: "Verified",
    medicalBadge: "Medical Alert - Nurse Notified",
    medicalDetails: "Asthma - Inhaler needed for outdoor walk",
    signedDate: "2026-11-15"
  },
  {
    slipId: "SLIP-STU-003",
    studentId: "10046124",
    studentName: "Sophia Rodriguez",
    assignedTeacher: "Kevin Wendland",
    needsBrunch: "Yes",
    needsLunch: "Yes",
    parentPhone: "(909) 555-0277",
    parentEmail: "dgomez@example.com",
    insuranceBadge: "Verified",
    medicalBadge: "Standard Clearance",
    signedDate: "2026-11-15"
  },
  {
    slipId: "SLIP-STU-004",
    studentId: "10046205",
    studentName: "Lucas Vance",
    assignedTeacher: "Kevin Wendland",
    needsBrunch: "Yes",
    needsLunch: "No",
    parentPhone: "(909) 555-0312",
    parentEmail: "avance@example.com",
    insuranceBadge: "Verified",
    medicalBadge: "Medical Alert - Nurse Notified",
    medicalDetails: "Severe peanut allergy - carries EpiPen",
    signedDate: "2026-11-15"
  },
  {
    slipId: "SLIP-STU-005",
    studentId: "10046011",
    studentName: "Marcus Lee",
    assignedTeacher: "Kevin Wendland",
    needsBrunch: "No",
    needsLunch: "No",
    parentPhone: "(909) 555-0455",
    parentEmail: "jlee@example.com",
    insuranceBadge: "Uninsured - Blocked",
    medicalBadge: "Standard Clearance",
    signedDate: "2026-11-15"
  },
  {
    slipId: "SLIP-STU-006",
    studentId: "10046310",
    studentName: "Emma Watson",
    assignedTeacher: "Kevin Wendland",
    needsBrunch: "No",
    needsLunch: "Yes",
    parentPhone: "(909) 555-0589",
    parentEmail: "mwatson@example.com",
    insuranceBadge: "Verified",
    medicalBadge: "Standard Clearance",
    signedDate: "2026-11-15"
  },
  {
    slipId: "SLIP-STU-007",
    studentId: "10046422",
    studentName: "Aiden Patel",
    assignedTeacher: "Kevin Wendland",
    needsBrunch: "Yes",
    needsLunch: "Yes",
    parentPhone: "(909) 555-0671",
    parentEmail: "ppatel@example.com",
    insuranceBadge: "Verified",
    medicalBadge: "Standard Clearance",
    signedDate: "2026-11-15"
  },
  {
    slipId: "SLIP-STU-008",
    studentId: "10046535",
    studentName: "Olivia Chen",
    assignedTeacher: "Kevin Wendland",
    needsBrunch: "No",
    needsLunch: "Yes",
    parentPhone: "(909) 555-0782",
    parentEmail: "wchen@example.com",
    insuranceBadge: "Verified",
    medicalBadge: "Standard Clearance",
    signedDate: "2026-11-15"
  }
];

let mockVolunteers = [
  {
    slipId: "SLIP-VOL-01",
    volunteerName: "Robert Miller",
    childName: "Ethan Miller",
    emergencyContact: "Mary Miller ((909) 555-0144)",
    hasInsurance: "Yes",
    insuranceCarrier: "Blue Shield CA",
    signedDate: "2026-11-15"
  },
  {
    slipId: "SLIP-VOL-02",
    volunteerName: "Sarah Lin",
    childName: "Chloe Zhang",
    emergencyContact: "David Zhang ((909) 555-0198)",
    hasInsurance: "Yes",
    insuranceCarrier: "Kaiser Permanente",
    signedDate: "2026-11-15"
  },
  {
    slipId: "SLIP-VOL-03",
    volunteerName: "David Gomez",
    childName: "Sophia Rodriguez",
    emergencyContact: "Elena Gomez ((909) 555-0278)",
    hasInsurance: "Yes",
    insuranceCarrier: "Anthem Blue Cross",
    signedDate: "2026-11-15"
  }
];

let mockOpsNotes = {
  "FT-2026-0042": {
    isCompleted: false,
    latestNote: "Confirmed observatory group ticket reservation and scheduled bus pickup.",
    historicalNotes: "11/15/2026 (opssecretary@wvusd.org): Confirmed observatory group ticket reservation and scheduled bus pickup.\n11/14/2026 (opssecretary@wvusd.org): Initial trip submission received. Verified athletic and instructional calendar."
  },
  "FT-2026-0029": {
    isCompleted: true,
    latestNote: "Trip finalized. Board report entry logged.",
    historicalNotes: "11/04/2026 (opssecretary@wvusd.org): Trip finalized. Board report entry logged.\n10/28/2026 (opssecretary@wvusd.org): District bus TF-2026-302 confirmed with transportation."
  },
  "FT-2026-0038": {
    isCompleted: false,
    latestNote: "Charter bus quote pending from vendor. Followed up with carrier.",
    historicalNotes: "11/12/2026 (opssecretary@wvusd.org): Charter bus quote pending from vendor. Followed up with carrier."
  }
};

/**
 * Resolves the approver email for a given stage on a trip, accounting for delegated overrides
 */
export function getApproverEmailForStage(trip, stageName) {
  if (!trip) return '';
  const stage = stageName || trip.Current_Stage;

  if (trip.Stage_Overrides_JSON) {
    try {
      const overrides = typeof trip.Stage_Overrides_JSON === 'string' ? JSON.parse(trip.Stage_Overrides_JSON) : trip.Stage_Overrides_JSON;
      if (overrides && overrides[stage]) {
        const ov = overrides[stage];
        const delegated = typeof ov === 'object' ? ov.delegatedEmail : ov;
        if (delegated) return delegated;
      }
    } catch (e) {}
  }

  const site = WVUSD_SITES.find(s => s.name === trip.Site);
  if (stage === 'Site Admin Assistant') return site?.adminAssistantEmail || '';
  if (stage === 'Dean') return trip.Dean_Email || '';
  if (stage === 'Principal') return site?.principalEmail || '';
  if (stage === 'Operations Secretary') return 'kbenjamin@wvusd.org';
  if (stage === 'Transportation') return 'transportation@wvusd.org';
  if (stage === 'HR Personnel') return 'hr@wvusd.org';
  if (stage === 'Operations Director') return 'opsdirector@wvusd.org';
  return '';
}

/**
 * Checks if a specific stage has an active delegated override
 */
export function isStageDelegated(trip, stageName) {
  if (!trip || !trip.Stage_Overrides_JSON) return false;
  const stage = stageName || trip.Current_Stage;
  try {
    const overrides = typeof trip.Stage_Overrides_JSON === 'string' ? JSON.parse(trip.Stage_Overrides_JSON) : trip.Stage_Overrides_JSON;
    return !!(overrides && overrides[stage]);
  } catch (e) {
    return false;
  }
}

/**
 * Fallback engine for client-side demo and testing without blocking
 */
function handleLocalFallback(action, payload) {
  let email = payload.userEmail || '';
  let tokenName = '';
  let tokenPicture = '';

  if (!email && payload.idToken) {
    if (payload.idToken.startsWith('DEV_MOCK_')) {
      email = payload.idToken.replace('DEV_MOCK_', '');
    } else if (payload.idToken.includes('.')) {
      try {
        const base64Url = payload.idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decoded = JSON.parse(jsonPayload);
        email = decoded.email || '';
        tokenName = decoded.name || '';
        tokenPicture = decoded.picture || '';
      } catch (jwtErr) {
        console.warn("Could not decode JWT in fallback:", jwtErr);
      }
    }
  }

  if (!email) email = 'jdoe@wvusd.org';

  if (action === 'verifyAuth') {
    const roles = getRolesForEmail(email);
    return {
      user: {
        email: email,
        name: tokenName || (email.toLowerCase().includes('kwendland') ? 'Kevin Wendland' : email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())),
        picture: tokenPicture || "https://lh3.googleusercontent.com/a/default-user",
        roles: roles
      }
    };
  }

  if (action === 'getDirectory') {
    return {
      sites: WVUSD_SITES,
      deans: WVUSD_DEANS,
      superAdmins: cachedSuperAdmins
    };
  }

  if (action === 'getMyTrips') {
    const teacherName = email.toLowerCase().includes('kwendland') ? 'Kevin Wendland' : email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
    return mockTrips.map(t => {
      const personalizedTrip = {
        ...t,
        Requester_Email: email || t.Requester_Email,
        Teacher_In_Charge: teacherName || t.Teacher_In_Charge
      };
      const logs = mockLogs.filter(l => l.requestId === t.Request_ID);
      return {
        trip: personalizedTrip,
        logs: logs,
        pipeline: buildPipelineForTrip(personalizedTrip, logs),
        canEdit: (personalizedTrip.Status === "Action Required (Teacher Edit)" && !personalizedTrip.Locked_Boolean)
      };
    });
  }

  if (action === 'seedDemoData') {
    return {
      success: true,
      message: "Demo trips and permission slips successfully seeded."
    };
  }

  if (action === 'getOpsTrips') {
    return mockTrips.map(t => {
      const notes = mockOpsNotes[t.Request_ID] || { isCompleted: false, latestNote: '', historicalNotes: '' };
      const rawTripType = (t.Trip_Type || '').toLowerCase();
      const tripType = rawTripType.replace(/-/g, ' ');
      const isOvernight = tripType.includes('overnight') || (t.Departure_Date && t.Return_Date && t.Departure_Date !== t.Return_Date);
      const isMoreThan50 = tripType.includes('greater than 50') || tripType.includes('50 miles');
      const isOutOfState = tripType.includes('out of state') || tripType.includes('out of country') || rawTripType.includes('out-of-state');

      const requiresBoardApproval = isOutOfState;
      const requiresBoardNotification = (!isOutOfState) && (isOvernight || isMoreThan50 || t.Board_Approval_Ack === 'Yes');

      let bucket = 'Pending';
      if (t.Status === 'Approved (Complete)' || notes.isCompleted) bucket = 'Complete';
      else if (t.Status === 'Declined') bucket = 'Declined';
      else if (t.Status === 'Cancelled') bucket = 'Cancelled';

      const approverEmail = (t.Status === 'Approved (Complete)' || t.Status === 'Declined') 
        ? t.Status 
        : (getApproverEmailForStage(t, t.Current_Stage) || t.Current_Stage || '');

      return {
        requestNum: t.Request_ID,
        site: t.Site,
        status: t.Status,
        bucket: bucket,
        currentApprover: approverEmail,
        currentApproverEmail: getApproverEmailForStage(t, t.Current_Stage),
        currentStageName: t.Current_Stage || '',
        isApproverDelegated: isStageDelegated(t, t.Current_Stage),
        teacherInCharge: t.Teacher_In_Charge || '',
        group: t.Group_Name || '',
        typeOfTrip: t.Trip_Type || '',
        destination: t.Destination || '',
        address: t.Venue_Address || '',
        depDate: t.Departure_Date || '',
        depTime: t.Departure_Time || '',
        retDate: t.Return_Date || '',
        retTime: t.Return_Time || '',
        submissionDate: t.Submitted_Timestamp ? t.Submitted_Timestamp.substring(0, 10) : '',
        description: t.Activity_Description || '',
        mileage: t.mileage || (t.Request_ID === 'FT-2026-0042' ? '35.2' : t.Request_ID === 'FT-2026-0038' ? '28.4' : t.Request_ID === 'FT-2026-0050' ? '2650.0' : (isMoreThan50 ? '58.4' : '7.0')),
        isOvernight,
        isMoreThan50Miles: isMoreThan50,
        isOutOfState,
        requiresBoardApproval,
        requiresBoardNotification,
        boardAck: t.Board_Approval_Ack || 'No',
        isCompleted: notes.isCompleted,
        latestNote: notes.latestNote,
        historicalNotes: notes.historicalNotes
      };
    });
  }

  if (action === 'submitTripNotes') {
    const rId = payload.requestId;
    const note = payload.newNote || payload.newNotes || '';
    const completed = payload.isCompleted === true;
    const existing = mockOpsNotes[rId] || { isCompleted: false, latestNote: '', historicalNotes: '' };
    const dateStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const newEntry = note.trim() ? `${dateStr} (${email}): ${note.trim()}` : '';
    const updatedHistorical = newEntry ? (existing.historicalNotes ? `${newEntry}\n${existing.historicalNotes}` : newEntry) : existing.historicalNotes;

    mockOpsNotes[rId] = {
      isCompleted: completed,
      latestNote: note.trim() || existing.latestNote,
      historicalNotes: updatedHistorical
    };

    return {
      success: true,
      requestId: rId,
      isCompleted: completed,
      historicalNotes: updatedHistorical
    };
  }

  if (action === 'reassignApprover') {
    const { requestId, stageName, newApproverEmail, reason } = payload;
    const trip = mockTrips.find(t => t.Request_ID === requestId);
    if (!trip) throw new Error("Trip not found: " + requestId);

    const targetStage = stageName || trip.Current_Stage;
    const oldEmail = getApproverEmailForStage(trip, targetStage);

    let overrides = {};
    if (trip.Stage_Overrides_JSON) {
      try {
        overrides = typeof trip.Stage_Overrides_JSON === 'string' ? JSON.parse(trip.Stage_Overrides_JSON) : trip.Stage_Overrides_JSON;
      } catch (e) {}
    }

    const nowTimestamp = new Date().toISOString();
    overrides[targetStage] = {
      delegatedEmail: newApproverEmail,
      originalEmail: oldEmail,
      reassignedBy: email,
      reason: reason || "Administrative coverage assignment",
      timestamp: nowTimestamp
    };

    trip.Stage_Overrides_JSON = JSON.stringify(overrides);

    // Append to mockLogs
    const comment = `Reassigned [${targetStage}] approver from (${oldEmail || 'Site default'}) to (${newApproverEmail}). Reason: ${reason || 'Administrative coverage'}`;
    mockLogs.push({
      logId: 'LOG-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      requestId: requestId,
      timestamp: nowTimestamp,
      actorEmail: email,
      actorRole: 'Ops / District Admin',
      action: 'Reassigned Approver',
      commentText: comment,
      stageFrom: targetStage,
      stageTo: targetStage
    });

    // Also append to mockOpsNotes
    const existing = mockOpsNotes[requestId] || { isCompleted: false, latestNote: '', historicalNotes: '' };
    const dateStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const opsNote = `[Reassigned ${targetStage} Approver]: Delegated to ${newApproverEmail} by ${email}. Reason: ${reason || 'Administrative coverage'}`;
    const newEntry = `${dateStr} (${email}): ${opsNote}`;
    mockOpsNotes[requestId] = {
      ...existing,
      latestNote: opsNote,
      historicalNotes: existing.historicalNotes ? `${newEntry}\n${existing.historicalNotes}` : newEntry
    };

    return {
      success: true,
      requestId,
      stageName: targetStage,
      newApproverEmail,
      oldApproverEmail: oldEmail,
      reason,
      timestamp: nowTimestamp
    };
  }

  if (action === 'getApproverTrips') {
    return mockTrips.map(t => {
      const logs = mockLogs.filter(l => l.requestId === t.Request_ID);
      return {
        trip: t,
        logs: logs,
        pipeline: buildPipelineForTrip(t, logs),
        canAct: canUserActOnTrip(email, t)
      };
    });
  }

  if (action === 'getTripDetails') {
    const trip = mockTrips.find(t => t.Request_ID === payload.requestId) || mockTrips[0];
    const logs = mockLogs.filter(l => l.requestId === trip.Request_ID);
    return {
      trip: trip,
      logs: logs,
      pipeline: buildPipelineForTrip(trip, logs),
      canAct: canUserActOnTrip(email, trip),
      activeStages: getActiveStages(trip)
    };
  }

  if (action === 'createRequest') {
    const newId = `FT-2026-${String(mockTrips.length + 1).padStart(4, '0')}`;
    const newTrip = {
      ...payload.formData,
      Request_ID: newId,
      Status: "Under Review",
      Current_Stage: "Site Admin Assistant",
      Submitted_Timestamp: new Date().toISOString(),
      Requester_Email: email,
      Locked_Boolean: false,
      Last_Updated: new Date().toISOString()
    };
    mockTrips.unshift(newTrip);
    mockLogs.push({
      logId: `LOG-${Date.now()}`,
      requestId: newId,
      timestamp: new Date().toISOString(),
      actorEmail: email,
      actorRole: "Teacher",
      action: "Submitted",
      commentText: "Initial field trip request submitted.",
      stageFrom: "New",
      stageTo: "Site Admin Assistant"
    });
    return {
      success: true,
      requestId: newId,
      status: newTrip.Status,
      currentStage: newTrip.Current_Stage
    };
  }

  if (action === 'updateRequest') {
    const idx = mockTrips.findIndex(t => t.Request_ID === payload.requestId);
    if (idx > -1) {
      mockTrips[idx] = {
        ...mockTrips[idx],
        ...payload.formData,
        Status: "Under Review",
        Last_Updated: new Date().toISOString()
      };
      mockLogs.push({
        logId: `LOG-${Date.now()}`,
        requestId: payload.requestId,
        timestamp: new Date().toISOString(),
        actorEmail: email,
        actorRole: "Teacher",
        action: "Resubmitted",
        commentText: payload.formData.revisionComment || "Teacher made requested changes and resubmitted.",
        stageFrom: "Teacher Revision",
        stageTo: mockTrips[idx].Current_Stage
      });
      return { success: true, requestId: payload.requestId };
    }
  }

  if (action === 'processApproval') {
    const idx = mockTrips.findIndex(t => t.Request_ID === payload.requestId);
    if (idx > -1) {
      const trip = mockTrips[idx];
      const stages = getActiveStages(trip);
      const currentIdx = stages.findIndex(s => s.name === trip.Current_Stage);
      let newStatus = trip.Status;
      let newStage = trip.Current_Stage;
      let locked = false;

      if (payload.decision === 'Approve') {
        if (currentIdx === -1 || currentIdx === stages.length - 1) {
          newStatus = "Approved (Complete)";
          newStage = "Approved";
          locked = true;
        } else {
          newStage = stages[currentIdx + 1].name;
          newStatus = "Under Review";
        }
      } else if (payload.decision === 'Decline') {
        newStatus = "Declined";
        newStage = "Declined";
        locked = true;
      } else if (payload.decision === 'Request Changes') {
        newStatus = "Action Required (Teacher Edit)";
        newStage = trip.Current_Stage; // Pauses at this stage
      }

      trip.Status = newStatus;
      trip.Current_Stage = newStage;
      trip.Locked_Boolean = locked;
      trip.Last_Updated = new Date().toISOString();

      mockLogs.push({
        logId: `LOG-${Date.now()}`,
        requestId: payload.requestId,
        timestamp: new Date().toISOString(),
        actorEmail: email,
        actorRole: trip.Current_Stage,
        action: payload.decision === 'Request Changes' ? 'Request Changes' : (payload.decision === 'Approve' ? 'Approved' : 'Declined'),
        commentText: payload.commentText || '',
        stageFrom: trip.Current_Stage,
        stageTo: newStage
      });

      return { success: true, status: newStatus, currentStage: newStage };
    }
  }

  if (action === 'getRoster') {
    const trip = mockTrips.find(t => t.Request_ID === payload.requestId) || mockTrips[0];
    const brunchCount = mockStudents.filter(s => s.needsBrunch === 'Yes').length;
    const lunchCount = mockStudents.filter(s => s.needsLunch === 'Yes').length;
    return {
      requestId: payload.requestId,
      tripHeader: trip,
      studentSlipsCount: mockStudents.length,
      volunteerSlipsCount: mockVolunteers.length,
      brunchCount,
      lunchCount,
      studentSlipUrl: `${GAS_API_URL}?view=slip&reqId=${encodeURIComponent(payload.requestId)}`,
      volunteerSlipUrl: `${GAS_API_URL}?view=volunteer&reqId=${encodeURIComponent(payload.requestId)}`,
      teacherBreakdown: {
        "Kevin Wendland": { breakfasts: brunchCount, lunches: lunchCount, totalStudents: mockStudents.length }
      },
      mealRequest: null,
      siteCafeteriaEmail: "cafeteria@wvusd.org",
      students: mockStudents,
      volunteers: mockVolunteers
    };
  }

  if (action === 'submitMealRequest') {
    return {
      success: true,
      mealData: {
        submitted: true,
        submittedAt: new Date().toISOString(),
        pickupTime: payload.pickupTime || '08:00 AM',
        breakfastCount: payload.breakfastCount || 0,
        lunchCount: payload.lunchCount || 0,
        teacherSignature: payload.teacherSignature || 'Teacher in Charge',
        submittedBy: 'teacher@wvusd.org',
        cafeteriaEmails: 'cafeteria@wvusd.org'
      }
    };
  }

  if (action === 'exportCafeteriaCsv') {
    const trip = mockTrips.find(t => t.Request_ID === payload.requestId) || mockTrips[0];
    const header = `"WVUSD Field Trip Attendance & Meal Request Roster"\r\n"Trip ID:","${trip.Request_ID}","Destination:","${trip.Destination}"\r\n"Site:","${trip.Site}"\r\n\r\n"Student ID","Student Name","Teacher","Brunch","Lunch","Parent Phone","Insurance Status","Medical Status"\r\n`;
    const rows = mockStudents.map(s => `"${s.studentId}","${s.studentName}","${s.assignedTeacher}","${s.needsBrunch}","${s.needsLunch}","${s.parentPhone}","${s.insuranceBadge}","${s.medicalBadge}"`).join('\r\n');
    return { csv: header + rows };
  }

  return { success: true };
}

let cachedSuperAdmins = JSON.parse(localStorage.getItem('wvusd_super_admins') || '["kwendland@wvusd.org"]');

export function setCachedSuperAdmins(admins) {
  if (Array.isArray(admins) && admins.length > 0) {
    cachedSuperAdmins = admins.map(a => String(a).toLowerCase().trim());
    localStorage.setItem('wvusd_super_admins', JSON.stringify(cachedSuperAdmins));
  }
}

export function isSuperAdminEmail(email) {
  if (!email) return false;
  const clean = String(email).toLowerCase().trim();
  return cachedSuperAdmins.includes(clean) || clean === 'kwendland@wvusd.org';
}

function getRolesForEmail(userEmail) {
  const e = (userEmail || '').toLowerCase();
  const isSuper = isSuperAdminEmail(e);

  const roles = {
    isStaff: true,
    isApprover: isSuper,
    isOpsSecretary: isSuper,
    isSuperAdmin: isSuper,
    approverTypes: []
  };

  if (isSuper) {
    roles.approverTypes.push('Super Admin');
  }

  // Check admin
  if (e.includes('opsdirector') || e.includes('kwendland')) {
    roles.isApprover = true;
    roles.isOpsSecretary = true;
    if (!roles.approverTypes.includes('Operations Director') && !isSuper) {
      roles.approverTypes.push('Operations Director');
    }
  }
  if (e.includes('opssecretary')) {
    roles.isApprover = true;
    roles.isOpsSecretary = true;
    if (!roles.approverTypes.includes('Operations Secretary')) {
      roles.approverTypes.push('Operations Secretary');
    }
  }
  if (e.includes('transportation')) {
    roles.isApprover = true;
    roles.approverTypes.push('Transportation');
  }
  if (e.includes('hr') || e.includes('risk')) {
    roles.isApprover = true;
    roles.approverTypes.push('Risk Management');
  }

  // Check sites
  WVUSD_SITES.forEach(s => {
    if (s.principalEmail.toLowerCase() === e) {
      roles.isApprover = true;
      roles.approverTypes.push(`Principal (${s.name})`);
    }
    if (s.adminAssistantEmail.toLowerCase() === e) {
      roles.isApprover = true;
      roles.approverTypes.push(`Admin Assistant (${s.name})`);
    }
  });

  // Check deans
  WVUSD_DEANS.forEach(d => {
    if (d.email.toLowerCase() === e) {
      roles.isApprover = true;
      roles.approverTypes.push(`Dean (${d.name})`);
    }
  });

  return roles;
}

function getActiveStages(trip) {
  const stages = [
    { name: "Site Admin Assistant", label: "Admin Asst" }
  ];
  if (trip.Dean_Name && trip.Dean_Name !== "Not Applicable") {
    stages.push({ name: "Dean", label: "Dean" });
  }
  stages.push({ name: "Principal", label: "Principal" });
  stages.push({ name: "Operations Secretary", label: "Ops Sec" });

  const type = (trip.Transportation_Type || '').toLowerCase();
  if (type.includes('bus') || type.includes('rental') || (trip.Transport_Details_JSON || '').includes('TF-')) {
    stages.push({ name: "Transportation", label: "Transp." });
  }

  const vCount = parseInt(trip.Volunteer_Count, 10) || 0;
  if (vCount > 0 || (trip.Cleared_Volunteers && trip.Cleared_Volunteers.trim().length > 0)) {
    stages.push({ name: "HR Personnel", label: "Risk Management" });
  }

  stages.push({ name: "Operations Director", label: "Ops Dir" });
  return stages;
}

function buildPipelineForTrip(trip, logs) {
  const allStages = [
    { key: "admin_assistant", name: "Site Admin Assistant", label: "Admin Asst" },
    { key: "dean", name: "Dean", label: "Dean" },
    { key: "principal", name: "Principal", label: "Principal" },
    { key: "ops_secretary", name: "Operations Secretary", label: "Ops Sec" },
    { key: "transportation", name: "Transportation", label: "Transp." },
    { key: "hr", name: "HR Personnel", label: "Risk Management" },
    { key: "ops_director", name: "Operations Director", label: "Ops Dir" }
  ];

  const activeStages = getActiveStages(trip);
  const activeNames = activeStages.map(s => s.name);
  const currentIdx = activeNames.indexOf(trip.Current_Stage);
  const isApproved = trip.Status === "Approved (Complete)";
  const isDeclined = trip.Status === "Declined";
  const isChanges = trip.Status === "Action Required (Teacher Edit)";

  const approvedMap = {};
  logs.forEach(l => {
    if (l.action === 'Approved') approvedMap[l.stageFrom] = l;
  });

  return allStages.map(stage => {
    const isActive = activeNames.includes(stage.name);
    if (!isActive) {
      return { ...stage, status: "skipped" };
    }

    const stageIdx = activeNames.indexOf(stage.name);

    if (isApproved) {
      const log = approvedMap[stage.name];
      return { ...stage, status: "approved", actorEmail: log?.actorEmail, timestamp: log?.timestamp };
    }

    if (stage.name === trip.Current_Stage) {
      if (isChanges) return { ...stage, status: "changes_requested" };
      if (isDeclined) return { ...stage, status: "declined" };
      return { ...stage, status: "active" };
    }

    if (currentIdx > -1 && stageIdx < currentIdx) {
      const log = approvedMap[stage.name];
      return { ...stage, status: "approved", actorEmail: log?.actorEmail, timestamp: log?.timestamp };
    }

    return { ...stage, status: "waiting" };
  });
}

function canUserActOnTrip(userEmail, trip) {
  if (trip.Locked_Boolean || trip.Status === "Approved (Complete)" || trip.Status === "Declined") {
    return false;
  }
  const e = (userEmail || '').toLowerCase();
  if (isSuperAdminEmail(e) || e.includes('opsdirector') || e.includes('kwendland')) return true;

  const currentStage = trip.Current_Stage;
  const delegatedEmail = getApproverEmailForStage(trip, currentStage);
  if (delegatedEmail && delegatedEmail.toLowerCase() === e) {
    return true;
  }

  if (currentStage === 'Site Admin Assistant') {
    const site = WVUSD_SITES.find(s => s.name === trip.Site);
    return site && site.adminAssistantEmail.toLowerCase() === e;
  }
  if (currentStage === 'Dean') {
    return trip.Dean_Email && trip.Dean_Email.toLowerCase() === e;
  }
  if (currentStage === 'Principal') {
    const site = WVUSD_SITES.find(s => s.name === trip.Site);
    return site && site.principalEmail.toLowerCase() === e;
  }
  if (currentStage === 'Operations Secretary') {
    return e.includes('opssecretary');
  }
  if (currentStage === 'Transportation') {
    return e.includes('transportation');
  }
  if (currentStage === 'HR Personnel' || currentStage === 'Risk Management') {
    return e.includes('hr') || e.includes('risk');
  }
  if (currentStage === 'Operations Director') {
    return e.includes('opsdirector');
  }
  return false;
}

export function formatStageName(stage) {
  if (!stage) return '';
  if (stage === 'HR Personnel' || stage === 'HR') return 'Risk Management';
  return stage;
}

// Client API Methods
export const api = {
  verifyToken: async (idToken) => {
    const res = await callGasApi('verifyAuth', {}, idToken);
    if (res?.user?.email && isSuperAdminEmail(res.user.email)) {
      res.user.roles = res.user.roles || {};
      res.user.roles.isSuperAdmin = true;
      res.user.roles.isApprover = true;
      res.user.roles.isOpsSecretary = true;
      res.user.roles.approverTypes = res.user.roles.approverTypes || [];
      if (!res.user.roles.approverTypes.includes('Super Admin')) {
        res.user.roles.approverTypes.unshift('Super Admin');
      }
    }
    return res;
  },
  getDirectory: async () => {
    const res = await callGasApi('getDirectory');
    if (res?.superAdmins) {
      setCachedSuperAdmins(res.superAdmins);
    }
    return res;
  },
  getMyTrips: () => callGasApi('getMyTrips'),
  getApproverTrips: () => callGasApi('getApproverTrips'),
  getTripDetails: (requestId) => callGasApi('getTripDetails', { requestId }),
  createRequest: (formData) => callGasApi('createRequest', { formData }),
  updateRequest: (requestId, formData) => callGasApi('updateRequest', { requestId, formData }),
  processApproval: (requestId, decision, commentText) => callGasApi('processApproval', { requestId, decision, commentText }),
  getRoster: (requestId) => callGasApi('getRoster', { requestId }),
  exportCafeteriaCsv: (requestId) => callGasApi('exportCafeteriaCsv', { requestId }),
  seedDemoData: () => callGasApi('seedDemoData'),
  getOpsTrips: () => callGasApi('getOpsTrips'),
  submitTripNotes: (requestId, newNote, isCompleted) => callGasApi('submitTripNotes', { requestId, newNote, isCompleted }),
  reassignApprover: (requestId, stageName, newApproverEmail, reason) => callGasApi('reassignApprover', { requestId, stageName, newApproverEmail, reason }),
  submitMealRequest: (requestId, payload) => callGasApi('submitMealRequest', { requestId, ...payload })
};

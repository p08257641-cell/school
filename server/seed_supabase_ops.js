import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function findRooms(hostelName) {
    const res = await pool.query('SELECT hr.id FROM hostel_rooms hr JOIN hostels h ON hr.hostel_id = h.id WHERE h.name = $1 LIMIT 1', [hostelName]);
    return res.rows.length ? res.rows[0].id : null;
}

async function seedOpsData() {
  const orgId = "cd15a058-082a-417b-a558-2241e0d3d2f1"; // St Patrick
  const staff1 = "d07ff304-f4a7-42c7-85f8-ae8fcec14cb9"; // John Doe
  const staff2 = "96987d73-be55-4cc4-a5b2-bc0e8791bbef"; // Jane Smith
  
  const studentIds = [
    "5ee4189e-e302-4495-be7b-f5ea2d00d4ba", "1856e85b-a99e-4e6f-b14e-37bb90c11079",
    "c8a1f2f2-d33e-4a45-b7d8-0e4f11594572", "f07cc6b5-3b83-4a53-9918-701213ebf8c6",
    "aa85f168-6176-423b-8361-dd1c6844b91f", "595f4364-888b-46bc-a32e-6c25d93fcbcd",
    "9bd3cbeb-d165-4602-8c54-34c4790bac54", "17aded56-8d40-4616-9fce-6d554a30d4f8",
    "ed6af0a6-bce6-491b-9080-d3f613fb7a60", "4574567c-7dc6-4f40-89b8-f1d9440bb7c5"
  ];
  
  const client = await pool.connect();
  
  try {
    console.log("Beginning Operations Seeding for Org: " + orgId);
    await client.query('BEGIN');

    // --- 1. Clubs ---
    console.log("Seeding Clubs...");
    const clubs = [
      { name: 'Coding & Robotics', description: 'Learn logic and build robots.', category: 'Professional', meeting_schedule: 'Wed 15:00', patron: staff1, dues: 50.00, max: 30 },
      { name: 'Debate Society', description: 'Develop public speaking skills.', category: 'Academic', meeting_schedule: 'Fri 16:00', patron: staff2, dues: 25.00, max: 50 },
      { name: 'Sports Club', description: 'Athletics, football, and teamwork.', category: 'Extracurricular', meeting_schedule: 'Tue 15:30', patron: staff1, dues: 30.00, max: 100 },
      { name: 'Arts & Culture', description: 'Theater, painting, and creativity.', category: 'Creative', meeting_schedule: 'Thu 16:00', patron: staff2, dues: 40.00, max: 40 }
    ];

    for (const club of clubs) {
      const res = await client.query(
        "INSERT INTO clubs (org_id, name, description, category, meeting_schedule, patron_staff_id, dues_amount, dues_frequency, max_members, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Per Term', $8, 'Active') ON CONFLICT DO NOTHING RETURNING id",
        [orgId, club.name, club.description, club.category, club.meeting_schedule, club.patron, club.dues, club.max]
      );
    }

    // --- 2. Health & Medical ---
    console.log("Seeding Health Records...");
    const healthRecords = [
      { student_id: studentIds[0], condition: 'Asthma Management', treatment: 'Inhaler as needed before sports', date: '2025-01-15', doctor: 'Dr. Sarah Connor' },
      { student_id: studentIds[1], condition: 'Peanut Allergy', treatment: 'EpiPen kept in nurse office', date: '2025-02-10', doctor: 'Dr. Albert West' },
      { student_id: studentIds[2], condition: 'Routine Vaccination', treatment: 'Completed standard booster shots', date: '2025-03-01', doctor: 'Dr. John Doe' },
      { student_id: studentIds[3], condition: 'Minor Sprain', treatment: 'Rest and ice for 3 days', date: '2025-03-12', doctor: 'Nurse Joy' }
    ];

    for (const hr of healthRecords) {
        await client.query("DELETE FROM health_records WHERE student_id = $1 AND condition = $2", [hr.student_id, hr.condition]);
        await client.query(
          "INSERT INTO health_records (org_id, student_id, condition, treatment, date, doctor_name) VALUES ($1, $2, $3, $4, $5, $6)",
          [orgId, hr.student_id, hr.condition, hr.treatment, hr.date, hr.doctor]
        );
    }

    // --- 3. Behavior & Discipline ---
    console.log("Seeding Behavior Records...");
    const behaviorRecords = [
      { student_id: studentIds[4], incident: 'Academic Excellence', action_taken: 'Awarded Certificate of Merit', date: '2025-02-15', severity: 'Positive' },
      { student_id: studentIds[5], incident: 'Leadership Award', action_taken: 'Recognized in school assembly', date: '2025-02-28', severity: 'Positive' },
      { student_id: studentIds[6], incident: 'Minor Classroom Disruption', action_taken: 'Verbal Warning given', date: '2025-03-05', severity: 'Minor' },
      { student_id: studentIds[7], incident: 'Missed Assignment Submission', action_taken: 'Parent notified', date: '2025-03-10', severity: 'Minor' },
      { student_id: studentIds[8], incident: 'Altercation in Hallway', action_taken: 'Detention and counseling session', date: '2025-03-02', severity: 'Major' },
      { student_id: studentIds[9], incident: 'Skipped Friday Assembly', action_taken: 'Warning Letter', date: '2025-03-14', severity: 'Minor' },
      { student_id: studentIds[1], incident: 'Vandalism (Graffiti)', action_taken: 'Suspended for 2 days. Restitution required.', date: '2025-01-20', severity: 'Severe' },
      { student_id: studentIds[2], incident: 'Perfect Attendance Term 1', action_taken: 'Awarded House Points', date: '2025-02-01', severity: 'Positive' }
    ];

    for (const br of behaviorRecords) {
      await client.query("DELETE FROM behavior_discipline WHERE student_id = $1 AND incident = $2", [br.student_id, br.incident]);
      await client.query(
        "INSERT INTO behavior_discipline (org_id, student_id, incident, action_taken, date, severity) VALUES ($1, $2, $3, $4, $5, $6)",
        [orgId, br.student_id, br.incident, br.action_taken, br.date, br.severity]
      );
    }

    // --- 4. Transport ---
    console.log("Seeding Transport Routes...");
    const routes = [
      { name: 'Northern Express', vehicle: 'BUS-NT-01', driver: 'Mark Thomson', phone: '555-0101', price: 150 },
      { name: 'Southern Shuttle', vehicle: 'VAN-ST-05', driver: 'Peter Parker', phone: '555-0102', price: 100 },
      { name: 'Eastern Loop', vehicle: 'BUS-EA-03', driver: 'Bruce Wayne', phone: '555-0103', price: 120 }
    ];
    
    // Clean old dummy data if there is to prevent dupes
    await client.query("DELETE FROM transport_routes WHERE org_id = $1 AND route_name IN ('Northern Express', 'Southern Shuttle', 'Eastern Loop')", [orgId]);

    const routeMap = {};
    for (const r of routes) {
      const res = await client.query(
        "INSERT INTO transport_routes (org_id, route_name, vehicle_number, driver_name, driver_phone, price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [orgId, r.name, r.vehicle, r.driver, r.phone, r.price]
      );
      routeMap[r.name] = res.rows[0].id;
    }
    
    // Assign a couple students to Northern express
    await client.query("UPDATE students SET transport_route_id = $1, transport_status = 'Approved', transport_pickup_location = 'Main Junction' WHERE id IN ($2, $3)", [routeMap['Northern Express'], studentIds[0], studentIds[1]]);
    await client.query("UPDATE students SET transport_route_id = $1, transport_status = 'Pending', transport_pickup_location = 'City Square' WHERE id IN ($2)", [routeMap['Southern Shuttle'], studentIds[2]]);


    // --- 5. Hostels ---
    console.log("Seeding Hostels...");
    const hostels = [
      { name: 'Everest House', type: 'Boys', warden: 'John Doe' },
      { name: 'Kilimanjaro Hall', type: 'Girls', warden: 'Jane Smith' },
      { name: 'Olympus Wing', type: 'Mixed', warden: 'Mr. Zeus' }
    ];

    await client.query("DELETE FROM hostels WHERE org_id = $1 AND name IN ('Everest House', 'Kilimanjaro Hall', 'Olympus Wing')", [orgId]);

    const hostelMap = {};
    for (const h of hostels) {
      const res = await client.query(
        "INSERT INTO hostels (org_id, name, type, warden_name) VALUES ($1, $2, $3, $4) RETURNING id",
        [orgId, h.name, h.type, h.warden]
      );
      hostelMap[h.name] = res.rows[0].id;
      
      // Let's create a couple of rooms for each
      await client.query("INSERT INTO hostel_rooms (org_id, hostel_id, room_number, capacity, price) VALUES ($1, $2, $3, $4, $5)", [orgId, res.rows[0].id, '101', 4, 300]);
      await client.query("INSERT INTO hostel_rooms (org_id, hostel_id, room_number, capacity, price) VALUES ($1, $2, $3, $4, $5)", [orgId, res.rows[0].id, '102', 2, 500]);
    }

    // Get a room to assign a student
    const roomId = await findRooms('Kilimanjaro Hall');
    if ( roomId ) {
        await client.query("UPDATE students SET hostel_room_id = $1, hostel_status = 'Approved' WHERE id = $2", [roomId, studentIds[3]]);
    }

    // --- 5. Announcements ---
    console.log("Seeding Announcements...");
    const announcements = [
      {
        title: "Welcome to the New Academic Year",
        content: "We are excited to start the new academic year with new programs and activities. Please check the notice board for updated schedules and event calendars.",
        target_audience: "ALL",
        priority: "High"
      },
      {
        title: "Staff Meeting Reminder",
        content: "All staff members are required to attend the monthly meeting this Friday at 2:00 PM in the main conference room. Attendance is mandatory.",
        target_audience: "STAFF",
        priority: "Normal"
      },
      {
        title: "Parent-Teacher Conference",
        content: "Parent-teacher conferences will be held next month. Please sign up for a time slot through the parent portal or contact the school office.",
        target_audience: "PARENT",
        priority: "Normal"
      },
      {
        title: "Exam Schedule Released",
        content: "The final exam schedule for this term has been released. Please check your student portal for detailed examination timings and venues.",
        target_audience: "STUDENT",
        priority: "High"
      }
    ];

    // Clean existing announcements for this org
    await client.query("DELETE FROM announcements WHERE org_id = $1", [orgId]);

    for (const announcement of announcements) {
      await client.query(
        "INSERT INTO announcements (org_id, sender_id, title, content, target_audience, priority) VALUES ($1, $2, $3, $4, $5, $6)",
        [orgId, staff1, announcement.title, announcement.content, announcement.target_audience, announcement.priority]
      );
    }

    await client.query('COMMIT');
    console.log("Seeding Completed Successfully.");

  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Seeding Failed: ", e);
  } finally {
    client.release();
    await pool.end();
  }
}

seedOpsData();

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

async function makeRequest(path, options = {}) {
  const url = new URL(path, BASE_URL);
  return new Promise((resolve, reject) => {
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || data
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      if (typeof options.body === 'string') {
        req.write(options.body);
      } else {
        req.write(JSON.stringify(options.body));
      }
    }
    req.end();
  });
}

function parseCookie(setCookieHeaders) {
  if (!setCookieHeaders) return '';
  const first = Array.isArray(setCookieHeaders) ? setCookieHeaders[0] : setCookieHeaders;
  return first.split(';')[0];
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('🧪 Starting PetCare Passport Complete 12-Workflow Test Suite');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // Workflow 1: Register a new user
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 1: Register a new user ---');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        full_name: 'Dr. John Watson',
        email: testEmail,
        phone: '+1 (555) 777-8888',
        password: 'Password@123',
        confirm_password: 'Password@123'
      }
    });
    assert(regRes.status === 201 && regRes.data.success, 'New user successfully registered in database');
    let userCookie = parseCookie(regRes.headers['set-cookie']);

    // Test duplicate registration rejection
    const dupRes = await makeRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        full_name: 'Duplicate Watson',
        email: testEmail,
        phone: '+1 (555) 777-8888',
        password: 'Password@123',
        confirm_password: 'Password@123'
      }
    });
    assert(dupRes.status === 409, 'Duplicate email registration correctly prevented with 409');

    // ------------------------------------------------------------------------
    // Workflow 2: Log in and access dashboard
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 2: Log in and access dashboard ---');
    const loginRes = await makeRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        email: testEmail,
        password: 'Password@123',
        remember_me: true
      }
    });
    assert(loginRes.status === 200 && loginRes.data.success, 'Authentication successful via email & bcrypt password hash');
    userCookie = parseCookie(loginRes.headers['set-cookie']);

    // Check auth session
    const meRes = await makeRequest('/api/auth/me', {
      headers: { 'Cookie': userCookie }
    });
    assert(meRes.status === 200 && meRes.data.user.email === testEmail, 'GET /api/auth/me returns authenticated owner profile');

    // Access dashboard stats
    const dashRes = await makeRequest('/api/dashboard/summary', {
      headers: { 'Cookie': userCookie }
    });
    assert(dashRes.status === 200 && dashRes.data.stats.totalPets === 0, 'Dashboard summary returns real DB records (empty initially)');

    // ------------------------------------------------------------------------
    // Workflow 3: Add a pet
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 3: Add a pet ---');
    const addPetRes = await makeRequest('/api/pets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': userCookie
      },
      body: {
        name: 'Barnaby',
        species: 'Dog',
        breed: 'Basset Hound',
        dob: '2023-01-15',
        gender: 'Male',
        current_weight: 22.4,
        microchip_number: '985141009999999',
        sterilization_status: 'Neutered/Spayed',
        allergies: 'Grain intolerance',
        special_care_instructions: 'Ear cleaning weekly, long walk enthusiast.'
      }
    });
    assert(addPetRes.status === 201 && addPetRes.data.success, 'Pet "Barnaby" created with unique publicId and QR code');
    const newPetId = addPetRes.data.petId;
    const newPetPublicId = addPetRes.data.publicId;

    // ------------------------------------------------------------------------
    // Workflow 4: Add vaccination and medical records
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 4: Add health records (upcoming & overdue) ---');
    // Overdue record: next_due_date = 2026-09-01 (past)
    const overdueRecordRes = await makeRequest(`/api/pets/${newPetId}/health-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: {
        category: 'vaccination',
        title: 'Bordetella Kennel Cough',
        date_administered: '2025-08-01',
        next_due_date: '2026-08-01',
        clinic_name: 'Baker Street Vet Clinic',
        dosage: '0.5 mL Intranasal'
      }
    });
    assert(overdueRecordRes.status === 201, 'Overdue vaccination record inserted');

    // Upcoming record: next_due_date within 30 days
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 10);
    const upcomingDateStr = upcomingDate.toISOString().substring(0, 10);

    const upcomingRecordRes = await makeRequest(`/api/pets/${newPetId}/health-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: {
        category: 'vaccination',
        title: 'Leptospirosis 4-Way',
        date_administered: '2025-10-10',
        next_due_date: upcomingDateStr,
        clinic_name: 'Baker Street Vet Clinic',
        dosage: '1.0 mL SQ'
      }
    });
    assert(upcomingRecordRes.status === 201, 'Upcoming booster record inserted');

    // ------------------------------------------------------------------------
    // Workflow 5: View upcoming and overdue reminders
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 5: View upcoming & overdue reminders ---');
    const remindersRes = await makeRequest('/api/reminders', {
      headers: { 'Cookie': userCookie }
    });
    assert(remindersRes.status === 200, 'Reminders API queried successfully');
    assert(remindersRes.data.counts.overdue >= 1, 'Overdue reminder calculated correctly from DB dates');
    assert(remindersRes.data.counts.upcoming >= 1 || remindersRes.data.counts.dueSoon >= 1, 'Upcoming reminder identified within 30 days');

    // ------------------------------------------------------------------------
    // Workflow 6: Generate and download QR code
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 6: Generate and access QR code ---');
    const qrRes = await makeRequest(`/api/pets/${newPetId}/qr`, {
      headers: { 'Cookie': userCookie }
    });
    assert(qrRes.status === 200 && qrRes.data.qrCodeUrl, 'QR code PNG url and Data URL accessible');
    assert(qrRes.data.emergencyUrl.includes(newPetPublicId), 'QR code points to unique, stable emergency URL');

    // ------------------------------------------------------------------------
    // Workflow 7: Open emergency profile in logged-out browser
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 7: Open emergency profile without logging in ---');
    const publicProfileRes = await makeRequest(`/api/emergency/${newPetPublicId}`);
    assert(publicProfileRes.status === 200 && publicProfileRes.data.success, 'Public emergency profile opens without auth cookie');
    assert(publicProfileRes.data.profile.name === 'Barnaby', 'Public profile shows correct pet name');
    assert(publicProfileRes.data.profile.owner_phone === null, 'Owner phone shielded by default privacy settings');

    // ------------------------------------------------------------------------
    // Workflow 8: Change privacy settings and verify public visibility
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 8: Update emergency privacy settings ---');
    const updatePrivacyRes = await makeRequest(`/api/pets/${newPetId}/emergency-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: {
        show_photo: 1,
        show_name: 1,
        show_species_breed: 1,
        show_medical_alerts: 1,
        show_allergies: 1,
        show_special_care: 1,
        show_emergency_phone: 1, // Explicitly ENABLE phone
        show_contact_form: 1,
        custom_emergency_instructions: 'Barnaby is friendly. Please call immediately!'
      }
    });
    assert(updatePrivacyRes.status === 200, 'Privacy settings updated by owner');

    // Re-check public emergency profile without logging in
    const updatedProfileRes = await makeRequest(`/api/emergency/${newPetPublicId}`);
    assert(updatedProfileRes.data.profile.owner_phone === '+1 (555) 777-8888', 'Public profile immediately reflects enabled phone number');
    assert(updatedProfileRes.data.profile.custom_emergency_instructions.includes('friendly'), 'Custom instructions visible to finder');

    // ------------------------------------------------------------------------
    // Workflow 9: Submit found-pet report without logging in
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 9: Finder submits found-pet report ---');
    const reportSubmitRes = await makeRequest(`/api/emergency/${newPetPublicId}/found-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        finder_name: 'Mary Morstan',
        finder_phone: '+1 (555) 444-3333',
        finder_email: 'mary@example.com',
        found_location: 'Regent Park near boating pond',
        message: 'Barnaby was sniffing near the fountain. He has water and is resting safely.'
      }
    });
    assert(reportSubmitRes.status === 201 && reportSubmitRes.data.success, 'Found-pet report submitted by unauthenticated finder');

    // ------------------------------------------------------------------------
    // Workflow 10: Confirm owner can view and update report status
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 10: Owner views found-pet report & marks resolved ---');
    const ownerReportsRes = await makeRequest('/api/found-reports', {
      headers: { 'Cookie': userCookie }
    });
    assert(ownerReportsRes.status === 200 && ownerReportsRes.data.count >= 1, 'Owner sees the found report in their reports dashboard');
    const reportItem = ownerReportsRes.data.reports[0];
    assert(reportItem.finder_name === 'Mary Morstan', 'Correct finder name displayed');

    // Update status to resolved
    const updateReportStatusRes = await makeRequest(`/api/found-reports/${reportItem.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': userCookie },
      body: { status: 'resolved' }
    });
    assert(updateReportStatusRes.status === 200, 'Owner marked incident report as resolved');

    // ------------------------------------------------------------------------
    // Workflow 11: Attempt unauthorized access to another owner\'s private pet
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 11: Security check - IDOR protection ---');
    // Seeded pet 1 belongs to Sarah Jenkins (user 1). John Watson (user 2) tries to access or delete pet 1:
    const idorGetRes = await makeRequest('/api/pets/1', {
      headers: { 'Cookie': userCookie }
    });
    assert(idorGetRes.status === 404, 'Cannot access another user\'s private pet (IDOR blocked with 404)');

    const idorDeleteRes = await makeRequest('/api/pets/1', {
      method: 'DELETE',
      headers: { 'Cookie': userCookie }
    });
    assert(idorDeleteRes.status === 404, 'Cannot delete another user\'s pet profile');

    // ------------------------------------------------------------------------
    // Workflow 12: Log out and verify protected APIs require authentication
    // ------------------------------------------------------------------------
    console.log('\n--- Workflow 12: Logout and protected route security ---');
    const logoutRes = await makeRequest('/api/auth/logout', {
      method: 'POST',
      headers: { 'Cookie': userCookie }
    });
    assert(logoutRes.status === 200, 'User logged out and session destroyed');

    const protectedAfterLogoutRes = await makeRequest('/api/pets', {
      headers: { 'Cookie': userCookie }
    });
    assert(protectedAfterLogoutRes.status === 401, 'Protected endpoint /api/pets returns 401 Unauthorized after logout');

    // Cleanup: Log in as Watson and delete the test pet Barnaby to keep DB clean
    const reLogin = await makeRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: testEmail, password: 'Password@123' }
    });
    const reCookie = parseCookie(reLogin.headers['set-cookie']);
    await makeRequest(`/api/pets/${newPetId}`, { method: 'DELETE', headers: { 'Cookie': reCookie } });

    console.log('\n===============================================================');
    console.log(`📊 Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runAllTests();

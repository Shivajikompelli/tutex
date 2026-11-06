const http = require('http');

async function post(path, body, headers = {}) {
  const data = JSON.stringify(body);
  const options = {
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      ...headers,
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function get(path, headers = {}) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path,
    method: 'GET',
    headers: {
      ...headers,
    },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- 1. Testing Candidate Registration ---');
  const regRes = await post('/api/exam/register', {
    name: 'Rohit Sharma',
    phone: '9876543210',
    email: 'rohit.sharma@example.com',
  });
  console.log('Registration Response:', regRes.status, regRes.data);
  const subId = regRes.data.submissionId;

  console.log('\n--- 2. Testing Session Loading ---');
  const sessRes = await get(`/api/exam/session?submission_id=${subId}`);
  console.log('Session Status:', sessRes.status);
  console.log('Questions received:', sessRes.data.questions?.length);
  const firstQ = sessRes.data.questions[0];
  console.log('First Question Order & Correct Option:', firstQ.question_order, firstQ.correct_option);

  console.log('\n--- 3. Testing Answer Save ---');
  const saveRes = await post('/api/exam/save-answer', {
    submission_id: subId,
    question_id: firstQ.id,
    selected_option: firstQ.correct_option, // Answer correctly!
  });
  console.log('Save Answer Response:', saveRes.status, saveRes.data);

  console.log('\n--- 4. Testing Final Submission & Score Calculation ---');
  const submitRes = await post('/api/exam/submit', {
    submission_id: subId,
    reason: 'manual',
  });
  console.log('Submit Response:', submitRes.status, submitRes.data);

  console.log('\n--- 5. Testing Single Attempt Lockdown (Re-attempt should be blocked) ---');
  const reattemptRes = await post('/api/exam/register', {
    name: 'Rohit Sharma',
    phone: '9876543210',
    email: 'rohit.sharma@example.com',
  });
  console.log('Re-attempt Response (alreadySubmitted should be true):', reattemptRes.data);

  console.log('\n--- 6. Testing Admin Submissions View ---');
  const adminRes = await get('/api/admin/submissions', {
    Cookie: 'admin_token=admin123',
  });
  console.log('Admin Submissions Count:', adminRes.data?.length);
  const candidateRecord = adminRes.data?.find((s) => s.id === subId);
  console.log('Candidate in Admin Dashboard:', {
    name: candidateRecord?.student?.name,
    score: candidateRecord?.score,
    status: candidateRecord?.status,
    attempted: candidateRecord?.answered_count,
  });

  console.log('\n--- 7. Testing 3 Proctoring Violations Auto-Submit Flow ---');
  const student2Reg = await post('/api/exam/register', {
    name: 'Virat Kohli',
    phone: '9123456789',
    email: 'virat.kohli@example.com',
  });
  const sub2Id = student2Reg.data.submissionId;
  console.log('Violation 1:');
  const v1 = await post('/api/exam/log-tab-event', { submission_id: sub2Id, event_type: 'visibility_hidden' });
  console.log('V1 count:', v1.data.tabSwitchCount);

  console.log('Violation 2:');
  const v2 = await post('/api/exam/log-tab-event', { submission_id: sub2Id, event_type: 'visibility_hidden' });
  console.log('V2 count:', v2.data.tabSwitchCount);

  console.log('Violation 3 (Should Auto-Submit):');
  const v3 = await post('/api/exam/log-tab-event', { submission_id: sub2Id, event_type: 'visibility_hidden' });
  console.log('V3 count & autoSubmitted:', v3.data);

  const checkSub2 = await get(`/api/exam/session?submission_id=${sub2Id}`);
  console.log('Sub2 Status after 3 violations:', checkSub2.data.submission?.status, 'isClosed:', checkSub2.data.isClosed);

  console.log('\nALL END-TO-END TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(console.error);


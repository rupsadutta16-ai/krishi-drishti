# Expert Workflow Testing Guide

## Setup & Prerequisites
1. Backend server running at `http://localhost:8000`
2. Frontend running at `http://localhost:5173` (or configured in .env)
3. Database with tables created via Alembic migrations

## Step-by-Step Testing Workflow

### 1. Create Test Accounts

#### Create a Farmer Account
1. Open app and click "Get Started (Register)"
2. Fill in:
   - Name: "Test Farmer"
   - Username: "farmer_test"
   - Email: "farmer@test.com"
   - Role: **"Farmer"** ✓
   - Password: "password123"
   - Language: English
3. Click "Complete Registration"

#### Create an Expert Account
1. Go back to login/register
2. Click "Get Started (Register)"
3. Fill in:
   - Name: "Test Expert"
   - Username: "expert_test"
   - Email: "expert@test.com"
   - Role: **"Agronomist / Expert"** ✓
   - Password: "password123"
   - Language: English
4. Click "Complete Registration"
5. Verify that you see the **Expert Portal Dashboard** (not Farmer Dashboard)

### 2. Farmer Workflow - Submit a Case

1. **Login as Farmer**
   - Use: farmer_test / password123
   - You should see the Farmer Dashboard with Navbar

2. **Create a Farm** (if not exists)
   - Go to "Crops & Farms"
   - Add Farm details (name, location, size)

3. **Add a Crop**
   - Still in "Crops & Farms"
   - Add crop details (type, variety, date planted)

4. **Submit an Observation**
   - Click "Add Observation" from Navbar
   - Upload an image (or select from gallery)
   - Fill in observation details (location, date, notes)
   - Submit observation

5. **Create a Case**
   - Go to "Reports"
   - Create a new case linking the observation
   - Add description like: "Yellow spots on leaves, looks like a disease"
   - **Submit to Expert** (This marks the case as PENDING_EXPERT)

### 3. Expert Workflow - Review & Validate

1. **Login as Expert**
   - Use: expert_test / password123
   - You should see **Expert Portal Dashboard** with:
     - Top navbar: "KRISHI DRISHTI · EXPERT PORTAL"
     - Review Queue showing pending cases

2. **View Review Queue**
   - Should see the farmer's submitted case in the queue
   - Card should show:
     - Case ID and title
     - Status: "Pending Expert"
     - Farmer ID, Farm ID, Crop ID
     - Submit date

3. **Open Case Detail**
   - Click on a case card
   - View full case information:
     - Case description from farmer
     - All observation images with quality scores
     - GPS coordinates (if available)
     - Image quality assessment
     - Previous validations (if any)

4. **Provide Expert Validation**
   - Choose one of three options:
     a) **✓ Confirm AI Prediction** - AI diagnosis was correct
     b) **✎ Correct Diagnosis** - Provide the correct disease/pest
     c) **❓ Needs Investigation** - More data required

   - Fill in **required fields**:
     - Expert Comments (pathological observations, visual markers, reasoning)
     - IPM & Agricultural Advice (treatment recommendations, dosage, alternatives)
   
   - If choosing "Correct Diagnosis":
     - Disease Name (required)
     - Pest/Vector (optional)

5. **Submit Validation**
   - Click "✓ Submit Validation"
   - Success message should appear
   - Queue should refresh
   - Case should disappear from pending queue (now VALIDATED)

### 4. Verify Data Integrity

#### Database Checks (SQL)
```sql
-- Check expert user was created
SELECT id, username, role FROM users WHERE username = 'expert_test';

-- Check case status changed to PENDING_EXPERT
SELECT id, farmer_id, status FROM agricultural_cases WHERE id = <case_id>;

-- Check expert validation record was created
SELECT * FROM expert_validations WHERE case_id = <case_id>;

-- Verify original AI analysis is NOT modified
SELECT * FROM ai_analyses WHERE observation_id = <obs_id>;
```

#### Expected Results
- Expert has role = "expert"
- Case status = "pending_expert" → "validated" (after validation)
- Expert validation record exists with:
  - validation_result: "confirmed" | "corrected" | "needs_investigation"
  - comments: Expert's observations
  - treatment_recommendation: IPM advice
  - corrected_disease: Optional (if corrected)
- Original AI analysis record unchanged

### 5. Error Handling Tests

#### Test 401 (Unauthorized)
1. Delete token from localStorage
2. Try accessing `/expert/cases`
3. Should get 401 error

#### Test 403 (Forbidden)
1. Login as Farmer
2. Try manually calling expert API: `GET /expert/cases`
3. Should get 403 Forbidden

#### Test 404 (Case Not Found)
1. Login as Expert
2. Try accessing non-existent case: `/expert/cases/99999`
3. Should get 404 Not Found

#### Test 400 (Invalid Status)
1. Login as Expert
2. Try validating a case that's already VALIDATED
3. Should get 400 error with message about status

### 6. UI/UX Tests

#### ExpertDashboard Features
- [ ] Navbar shows "KRISHI DRISHTI · EXPERT PORTAL"
- [ ] Refresh button works and reloads queue
- [ ] Logout button clears token and redirects
- [ ] Queue shows all farmer cases (not just assigned)
- [ ] Case cards show correct information
- [ ] Clicking case opens detail view
- [ ] Back button returns to queue
- [ ] Form validations work (required fields)
- [ ] Success/error messages appear correctly
- [ ] Loading spinners show during async operations

#### Form Validation
- [ ] Comments field required - error shows if empty
- [ ] Treatment recommendation field required - error shows if empty
- [ ] Disease field required when "Correct Diagnosis" selected
- [ ] Submit button disabled until required fields filled
- [ ] Form clears after successful submission

### 7. Multi-Expert Scenario

1. **Create Second Expert**
   - Register another expert account: expert2@test.com

2. **Both Experts See Same Queue**
   - Login as both experts
   - Both should see same pending cases
   - First expert validates a case
   - Second expert's queue should update on refresh

3. **Validation History**
   - After first expert validates, "Previous Expert Validations" section appears
   - Shows expert's decision, comments, and recommendations

## Common Issues & Fixes

### Issue: 403 Forbidden when accessing expert routes
**Solution**: 
- Verify role is "expert" (not "farmer")
- Clear browser cache and localStorage
- Check auth_service.py is using correct role mapping

### Issue: Queue shows no cases
**Solutions**:
- Verify farmer submitted case with status PENDING_EXPERT
- Check database: `SELECT * FROM agricultural_cases WHERE status = 'pending_expert'`
- Refresh the page
- Check API response in browser console

### Issue: Expert can see other's validation but not own
**Solution**: 
- Previous validations should be visible after submission
- Refresh page to reload case detail
- Check database for expert_validations records

### Issue: Expert modifies AI analysis
**Solution**:
- This MUST NOT happen
- AI analysis should be in separate table (ai_analyses)
- Expert validation in separate table (expert_validations)
- Check database schema integrity

## Performance Notes
- Queue loading should complete in < 2 seconds
- Case detail loading should complete in < 1 second
- Validation submission should complete in < 1 second
- UI should remain responsive during loading

## Security Checklist
- [ ] Experts cannot access other roles' endpoints
- [ ] Experts cannot view cases they have no access to
- [ ] Validation data includes timestamp and expert_id
- [ ] Token expiration works correctly
- [ ] Logout clears all session data

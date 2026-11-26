| area | check | result | detail |
|---|---|---|---|
| misc | GET /healthz 200 | PASS |  |
| misc | GET /readyz 200 (mongo+redis ok) | PASS |  |
| misc | GET /api/health 200 | PASS |  |
| misc | unknown route 404 JSON | PASS |  |
| misc | malformed JSON 400 | PASS |  |
| misc | body > 100 KB 413 | PASS |  |
| cors | foreign Origin gets no Access-Control-Allow-Origin | PASS |  |
| cors | CLIENT_URL Origin allowed | PASS |  |
| misc | helmet headers present, no x-powered-by | PASS |  |
| auth | register happy path 201 + token | PASS |  |
| auth | register duplicate email 400 | PASS |  |
| auth | register weak password 400 | PASS |  |
| auth | register invalid email 400 | PASS |  |
| auth | register with role=admin rejected 400 | PASS |  |
| auth | register missing fields 400 | PASS |  |
| auth | register with HTML/unicode name stored as text (201) | PASS |  |
| auth | login happy 200 | PASS |  |
| auth | login email case-insensitive | PASS |  |
| auth | login wrong password 401 | PASS |  |
| auth | login unknown email 401 (same message) | PASS |  |
| security | NoSQL injection in login rejected 400 | PASS |  |
| auth | login missing fields 400 | PASS |  |
| auth | no token 401 | PASS |  |
| auth | garbage token 401 | PASS |  |
| auth | expired token 401 with expiry message | PASS |  |
| auth | token signed with other key 401 | PASS |  |
| security | alg=none token 401 | PASS |  |
| security | role=admin claim in a user token does not grant admin (403) | PASS |  |
| auth | valid token /user/check 200 | PASS |  |
| guest | POST /user/guest 201 + token | PASS |  |
| guest | guest token has typ=guest, no _id/email/role, 4 h | PASS |  |
| guest | guest GET /user/check -> 403 | PASS |  |
| guest | guest GET /user/profile -> 403 | PASS |  |
| guest | guest DELETE /user/profile -> 403 | PASS |  |
| guest | guest GET /problem/solved -> 403 | PASS |  |
| guest | guest GET /admin/dashboard -> 403 | PASS |  |
| guest | guest POST /problem -> 403 | PASS |  |
| guest | guest PUT /problem/6b08156c71be629dc459be3a -> 403 | PASS |  |
| guest | guest DELETE /problem/6b08156c71be629dc459be3a -> 403 | PASS |  |
| guest | guest GET /problem/6b08156c71be629dc459be3a/admin -> 403 | PASS |  |
| guest | guest POST /user/admin/register -> 403 | PASS |  |
| guest | guest GET /submission/health -> 403 | PASS |  |
| guest | guest can open a problem | PASS |  |
| guest | guest solution locked 403 isLocked | PASS |  |
| guest | second guest session allowed (new token) | PASS |  |
| problems | list default page: 20 rows, total 75 | PASS |  |
| problems | list rows carry only summary fields | PASS |  |
| problems | allTopics present | PASS |  |
| problems | limit=100 returns all 75, numbered 1..75 | PASS |  |
| problems | page beyond end: 200 empty | PASS |  |
| problems | search "sum" finds Two Sum, 3Sum, etc. | PASS |  |
| security | regex chars in search are escaped (no match-all) | PASS |  |
| problems | search is case-insensitive | PASS |  |
| problems | difficulty=easy only Easy | PASS |  |
| problems | easy+medium+hard = 75 | PASS |  |
| problems | topic filter "Arrays & Hashing" | PASS |  |
| problems | topic filter case-insensitive | PASS |  |
| validation | bad difficulty 400 | PASS |  |
| validation | limit=1000 400 | PASS |  |
| validation | repeated search param 400 | PASS |  |
| validation | page=0 400 | PASS |  |
| problems | status=solved anonymous ignored (all) | PASS |  |
| problems | GET /problem/:slug without token 401 | PASS |  |
| problems | GET /problem/:slug 200 | PASS |  |
| security | public problem has no hiddenTestCases / referenceSolutions / driverCode | PASS |  |
| problems | public problem has cpp+java starters, examples, visible test | PASS |  |
| problems | GET /problem/:_id (legacy) 200 | PASS |  |
| problems | slug lookup case-insensitive | PASS |  |
| problems | unknown slug 404 | PASS |  |
| problems | unknown id 404 | PASS |  |
| validation | malformed slug 400 | PASS |  |
| authz | user GET /problem/:id/admin 403 | PASS |  |
| authz | admin GET /problem/:id/admin 200 with hidden tests | PASS |  |
| authz | unsolved user: solution locked 403 | PASS |  |
| authz | admin: solution 200 | PASS |  |
| problems | GET /problem/solved user 200 | PASS |  |
| judge | run (user, cpp, correct) 200 Accepted on visible test | PASS |  |
| judge | run (guest, java, correct) 200 Accepted | PASS |  |
| validation | run unsupported language 400 | PASS |  |
| validation | run code > 64k chars 413 | PASS |  |
| validation | run missing code 400 | PASS |  |
| validation | run unknown problem 404 | PASS |  |
| validation | run bad id 400 | PASS |  |
| auth | run without token 401 | PASS |  |
| judge | unicode / $& / {{USER_CODE}} inside user code still Accepted | PASS |  |
| judge | submit (user) 201 Accepted 10/10 | PASS |  |
| security | submit response has no hidden test data / errorDetail | PASS |  |
| judge | submit wrong answer -> Wrong Answer, no hidden input leaked | PASS |  |
| authz | after Accepted: solution unlocked 200 | PASS |  |
| problems | status=solved lists two-sum | PASS |  |
| problems | status=unsolved excludes two-sum | PASS |  |
| profile | profile stats count solve + submissions | PASS |  |
| history | user submission history 200, no code in rows | PASS |  |
| history | owner GET /submission/:id 200 with code | PASS |  |
| security | IDOR: other user GET /submission/:id -> 404 | PASS |  |
| security | IDOR: guest GET user submission -> 404 | PASS |  |
| security | admin cannot read other users submission via owner route (404) | PASS |  |
| guest | guest submit 201 Accepted | PASS |  |
| guest | guest sees own session submission | PASS |  |
| guest | other guest session sees none | PASS |  |
| security | IDOR: other guest GET guest submission 404 | PASS |  |
| security | IDOR: user GET guest submission 404 | PASS |  |
| guest | guest Accepted does not unlock solution | PASS |  |
| admin | dashboard 200, 75 problems | PASS |  |
| auth | logout 200 | PASS |  |
| auth | token revoked after logout 401 | PASS |  |
| guest | guest exit (logout) 200 | PASS |  |
| guest | revoked guest token 401 GUEST_SESSION_ENDED | PASS |  |
| authz | user POST /problem 403 | PASS |  |
| validation | admin POST /problem invalid body 400 | PASS |  |
| validation | admin POST duplicate title 400 | PASS |  |
| admin | create with wrong reference solution rejected by Judge0 validation 400 | PASS |  |
| admin | admin create problem (Judge0-validated) 201 | PASS |  |
| cache | topics cache invalidated on create | PASS |  |
| cache | topics cache repopulated on list | PASS |  |
| authz | user PUT /problem 403 | PASS |  |
| admin | admin metadata update 200, slug kept | PASS |  |
| cache | new topic visible after update (cache invalidated) | PASS |  |
| admin | PUT unknown id 404 | PASS |  |
| validation | PUT bad id 400 | PASS |  |
| authz | user DELETE /problem 403 | PASS |  |
| admin | admin DELETE /problem 200 | PASS |  |
| stale | submissions cascaded on problem delete | PASS |  |
| stale | problemsSolved pulled on problem delete | PASS |  |
| cache | deleted problem topic gone (cache invalidated) | PASS |  |
| admin | DELETE again 404 | PASS |  |
| authz | user POST /user/admin/register 403 | PASS |  |
| admin | admin registers user 201 | PASS |  |
| authz | user GET /admin/dashboard 403 | PASS |  |
| authz | anonymous GET /admin/dashboard 401 | PASS |  |
| admin | admin Judge0 health 200 online | PASS |  |
| security | Judge0 health has no host/port | PASS |  |
| authz | user GET /submission/health 403 | PASS |  |
| profile | DELETE /user/profile 200 | PASS |  |
| profile | deleted user token 401 | PASS |  |
| ai | AI tutor (user) 200 with reply | PASS |  |
| ai | AI tutor (guest) 200 and charged guest quota | PASS |  |
| validation | AI empty question 400 | PASS |  |
| validation | AI question > 1000 chars 400 | PASS |  |
| auth | AI without token 401 | PASS |  |
| ratelimit | login: 6th failed attempt for one email 429 | PASS |  |
| ratelimit | login: other account on same IP unaffected | PASS |  |
| ratelimit | login: 51st attempt from one IP 429 | PASS |  |
| ratelimit | register: 11th attempt in 15 min 429 | PASS |  |
| ratelimit | guest: 11th session per IP per hour 429 | PASS |  |
| ratelimit | run/submit: 51st request in 15 min 429 | PASS |  |
| ratelimit | AI: 11th question per user per 10 min 429 | PASS |  |

147 checks, 147 PASS, 0 FAIL. 2026-11-26T15:20:45.226Z

import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";
const testUser = {
  username: "user4",
  email: "user4@gmail.com",
  password: "1234",
};

const testAPI = async () => {
  try {
    // Register User
    const registerRes = await axios.post(
      `${API_BASE_URL}/auth/register`,
      testUser
    );
    console.log("✅ Registration:", registerRes.data);

    // Login User
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    console.log("✅ Login:", loginRes.data);
    const token = loginRes.data.token;

    // Fetch Referral Stats
    const referralStatsRes = await axios.get(
      `${API_BASE_URL}/referrals/stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("✅ Referral Stats:", referralStatsRes.data);
  } catch (error) {
    console.error("❌ Test Failed:", error.response?.data || error.message);
  }
};

testAPI();

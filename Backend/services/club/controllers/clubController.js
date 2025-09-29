const { 
  addUserAchievement, 
  getUserAchievements, 
  getUserById,
  getFollowNum,
  addUserGame,
  getUserGames,
  getGames
} = require("../clubServices/clubServices");

// Add achievement
async function addAchievement(req, res) {
  try {
    const { userid } = req.params;
    const { name, association, game, date } = req.body;

    const baseUrl = `${req.protocol}://${req.get("host")}`.replace("3000", "4000");

    const newAch = await addUserAchievement(
      userid,
      name,
      association,
      game,
      date,
      req.file,
      baseUrl
    );

    res.json({ success: true, ...newAch });
  } catch (err) {
    console.error("❌ Error adding achievement:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// List achievements
async function listAchievements(req, res) {
  try {
    const { userid } = req.params;
    const achievements = await getUserAchievements(userid);
    res.json({ success: true, achievements });
  } catch (err) {
    console.error("❌ Error listing achievements:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get user profile
async function getUserProfile(req, res) {
  try {
    const { userid } = req.params;
    const data = await getUserById(userid);

    if (!data) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (data.profilePhoto && !data.profilePhoto.startsWith("http")) {
      const baseUrl = `${req.protocol}://${req.get("host")}`.replace("3000", "4000");
      data.profilePhoto = `${baseUrl}/${data.profilePhoto}`;
    }

    res.json({ success: true, profile: data });
  } catch (err) {
    console.error("❌ Error fetching user profile:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

//get followers number
async function getFollowNums(req, res) {
  try {
    const userId = req.params.id;
    const stats = await getFollowNum(userId);
    res.json({ success: true, ...stats });
  } catch (error) {
    console.error("Error fetching follow numbers:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

//add games
async function addGame(req, res) {
  try {
    const { userid, gameid} = req.body;

    if (!userid || !gameid) {
      return res.status(400).json({
        success: false,
        error: "userid and gameid are required"
      });
    }
        const result = await addUserGame(
          userid,
          gameid,
        );
    
        res.json({ success: true, ...result });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    }

    //view games
    async function listGames(req, res) {
      try {
        const { userid } = req.params;
        const games = await getUserGames(userid);
        res.json({ success: true, games });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    }

async function getAllGames(req, res) {
  try {
    const games = await getGames();
    res.json({ success: true, games });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  addAchievement,
  listAchievements,
  getUserProfile,
  getFollowNums,
  addGame,
  listGames,
  getAllGames,
};

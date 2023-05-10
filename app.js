const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeServerDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error ${e.message}`);
    process.exit(1);
  }
};
initializeServerDb();

///
const convertPascalCaseToCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//get All the players from players TABLE;
app.get("/players/", async (request, response) => {
  const getPlayersDetails = `
    SELECT * FROM player_details`;
  const playersList = await db.all(getPlayersDetails);
  response.send(
    playersList.map((eachList) => convertPascalCaseToCamelCase(eachList))
  );
});
// get player details based on playerID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersDetails = `
    SELECT * FROM player_details WHERE player_id=${playerId}`;
  const playersList = await db.get(getPlayersDetails);
  response.send(convertPascalCaseToCamelCase(playersList));
});
//update players details
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const getPlayersDetails = `
    UPDATE player_details
    SET 
    player_name='${playerName}'
    WHERE player_id=${playerId}`;
  const playersList = await db.run(getPlayersDetails);
  response.send("Player Details Updated");
});
///get match details based on matchId
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT * FROM  match_details  WHERE match_id=${matchId}`;
  const matchList = await db.get(getMatchDetails);
  response.send(convertPascalCaseToCamelCase(matchList));
});

const convertPascalCaseToCamelCasePlayerAndMatchDetails = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//get all the list matches of player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersDetails = `
    SELECT * 
    FROM 
    player_match_score 
    NATURAL JOIN match_details 
    WHERE player_id=${playerId}`;
  const playersList = await db.all(getPlayersDetails);
  response.send(
    playersList.map((eachList) =>
      convertPascalCaseToCamelCasePlayerAndMatchDetails(eachList)
    )
  );
});
//
const pascalCaseToCamelCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersDetails = `
    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId}`;
  const playersList = await db.all(getPlayersDetails);
  response.send(playersList);
});
///
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersDetails = `
    SELECT 
    player_details.player_id as playerId,
    player_details.player_name as playerName,
    SUM(player_match_score.score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROM 
    player_details 
    INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id 
    WHERE player_details.player_id=${playerId}`;
  const playersList = await db.get(getPlayersDetails);
  response.send(playersList);
});

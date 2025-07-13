// Quick test for intelligent image generation
async function testIntelligentImageGeneration() {
  // Test with sample football content
  const testContent = {
    title: "Manchester United vs Liverpool - Premier League Clash",
    content: "🔥 PREMIER LEAGUE SHOWDOWN\n\nManchester United host Liverpool at Old Trafford in what promises to be the match of the week. Both teams are in excellent form, with United coming off a 3-1 victory against Arsenal, while Liverpool secured a crucial 2-0 win over Chelsea.\n\n⚽ Key Stats:\n• Man United: 15 goals scored in last 5 games\n• Liverpool: Unbeaten in 8 matches\n• Head-to-Head: 5-5 in last 10 meetings\n\n🎯 MATCH PREVIEW:\nThis classic rivalry promises goals and drama. United's attacking trio of Rashford, Fernandes, and Antony will face Liverpool's solid defense led by Van Dijk. Meanwhile, Liverpool's front three of Salah, Nunez, and Gakpo will test United's defensive resolve.\n\n⏰ Kickoff: Sunday 3:00 PM\n🏟️ Venue: Old Trafford\n📺 Live on Sky Sports\n\nWho will come out on top in this Premier League thriller?",
    contentType: "news",
    language: "en",
    teams: ["Manchester United", "Liverpool"],
    competition: "Premier League"
  };

  console.log("🧪 Testing intelligent image generation...");
  console.log("Content:", testContent.title);
  console.log("Teams:", testContent.teams.join(" vs "));
  console.log("Competition:", testContent.competition);
  
  // This would call the API to test image generation
  console.log("\n✅ Test setup complete - use this content to test via API");
  console.log("URL: POST http://localhost:3000/api/unified-content?action=preview&type=news&language=en");
}

testIntelligentImageGeneration();
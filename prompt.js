function callOpenAI(prompt) {
  var apiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_API_KEY");

  var payload = {
    "model": "gpt-3.5-turbo",
    "messages": [
      { "role": "system", "content": "You are a helpful assistant for writers." },
      { "role": "user", "content": prompt }
    ]
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + apiKey
    },
    "payload": JSON.stringify(payload)
  };

  try {
    var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", options);
    var result = JSON.parse(response.getContentText());

    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content;
    } else {
      Logger.log("OpenAI Error: " + JSON.stringify(result));
      return "OpenAI did not return a valid response.";
    }
  } catch (e) {
    Logger.log("Error calling OpenAI: " + e.toString());
    return "Error connecting to OpenAI.";
  }
}





function getParagraphsContainingCharacter(characterName) {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  var paragraphs = body.getParagraphs();
  var matches = [];

  for (var i = 0; i < paragraphs.length; i++) {
    var text = paragraphs[i].getText();
    if (text.includes(characterName)) {
      matches.push(text);
    }
  }

  return matches; // Returns an array of matching text
}

function buildFilteredPromptForCharacter(characterName, matchedTextArray) {
  var joinedText = matchedTextArray.join("\n\n");
  var prompt = `Summarize the character "${characterName}" based on the following text. Include appearance, personality traits, background, and notable actions:\n\n${joinedText}`;
  return prompt;
}

function summarizeCharacter(characterName) {  
  console.log('summarizeCharacter function is running');
  var matches = getParagraphsContainingCharacter(characterName);

  if (matches.length === 0) {
    Logger.log("No text found for character: " + characterName);
    return;
  }

  var prompt = buildFilteredPromptForCharacter(characterName, matches);
  var summary = callOpenAI(prompt);
  Logger.log("Character Summary:\n" + summary);
  return summary;
}





function getLocationSummary(locationName, text) { // Unused function
  var prompt = `Summarize the location "${locationName}" based on the following text. Include its appearance, purpose, history, and how characters interact with this location:\n\n${text}`;
  return callOpenAI(prompt);
}



function buildCharacterPrompt(name, text) { // Unused function
  return `
Summarize the character "${name}" based on the following text.

Include:
- Physical description
- Personality traits
- Background
- Notable relationships and actions

Text:
${text}
  `;
}

function summarize(catalog, name) {
  console.log('Attempting a summary for a ' + catalog);
  if (catalog == 'Character') {
    summarizeCharacter(name);
    return;
  }
  if (catalog == 'Event') {
    summarizeEvent(name);
    return;
  }
  if (catalog == 'Location') {
    summarizeLocation(name);
    return;
  }
}
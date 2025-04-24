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
  var prompt = `Summarize the character "${characterName}" based on the following text in paragraph form without using
                any external information:\n\n${joinedText}`;
  return prompt;
}

function summarizeCharacter(characterName) {  
  console.log('summarizeCharacter function is running');
  Logger.log("summarizeCharacter function is running");
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



function getParagraphsContainingEvent(eventName) {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  var paragraphs = body.getParagraphs();
  var matches = [];

  for (var i = 0; i < paragraphs.length; i++) {
    var text = paragraphs[i].getText();
    if (text.includes(eventName)) {
      matches.push(text);
    }
  }

  return matches; // Returns an array of matching text
}

function buildFilteredPromptForEvent(eventName, matchedTextArray) {
  var joinedText = matchedTextArray.join("\n\n");
  var prompt = `Summarize the event "${eventName}" based on the following text in paragraph form without using
                any external information:\n\n${joinedText}`;
  return prompt;
}

function summarizeEvent(eventName) {  
  console.log('summarizeEvent function is running');
  Logger.log("summarizeEvent function is running");
  var matches = getParagraphsContainingEvent(eventName);

  if (matches.length === 0) {
    Logger.log("No text found for event: " + eventName);
    return;
  }

  var prompt = buildFilteredPromptForEvent(eventName, matches);
  var summary = callOpenAI(prompt);
  Logger.log("Event Summary:\n" + summary);
  return summary;
}



function getParagraphsContainingLocation(locationName) {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  var paragraphs = body.getParagraphs();
  var matches = [];

  for (var i = 0; i < paragraphs.length; i++) {
    var text = paragraphs[i].getText();
    if (text.includes(locationName)) {
      matches.push(text);
    }
  }

  return matches; // Returns an array of matching text
}

function buildFilteredPromptForLocation(locationName, matchedTextArray) {
  var joinedText = matchedTextArray.join("\n\n");
  var prompt = `Summarize the location "${locationName}" based on the following text in paragraph form without using
                any external information:\n\n${joinedText}`;
  return prompt;
}

function summarizeLocation(locationName) {  
  console.log('summarizeLocation function is running');
  Logger.log("summarizeLocation function is running");
  var matches = getParagraphsContainingLocation(locationName);

  if (matches.length === 0) {
    Logger.log("No text found for location: " + locationName);
    return;
  }

  var prompt = buildFilteredPromptForLocation(locationName, matches);
  var summary = callOpenAI(prompt);
  Logger.log("Location Summary:\n" + summary);
  return summary;
}



function summarize(catalog, name) {
  var textCatalog = catalog.toString();
  console.log('Attempting a summary for a ');
  console.log(catalog);
  if (textCatalog == 'Characters') {
    return summarizeCharacter(name);
  }
  if (textCatalog == 'Events') {
    return summarizeEvent(name);
  }
  if (textCatalog == 'Locations') {
    return summarizeLocation(name);
  }
}



function buildPersonalityPrompt(entityName, text) {
  return `
Given the following description of the character "${entityName}", rate them on a scale of 0 to 100 for each personality trait below. Return only a JSON object with trait names as keys and numeric values as values.

Traits:
- Honesty
- Creativity
- Dominance
- Optimism
- Extroversion
- Logic
- Selfishness
- Forgiveness
- Humility
- Discipline

Text:
"""${text}"""
`;
}

function inferPersonalityTraits(entityName) {
  Logger.log("Inferring traits for: " + entityName);

  var matches = getParagraphsContainingCharacter(entityName);
  Logger.log("Found " + matches.length + " matches.");

  if (matches.length === 0) {
    Logger.log("No matching paragraphs found.");
    return null;
  }

  var text = matches.join("\n\n");
  var prompt = buildPersonalityPrompt(entityName, text);
  Logger.log("Prompt:\n" + prompt);

  var response = callOpenAI(prompt);
  Logger.log("Raw response from OpenAI: " + response);

  // Remove markdown-style code block (```json ... ```)
  var cleaned = response.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(cleaned.indexOf("\n") + 1); // remove ```json
    cleaned = cleaned.replace(/```$/, ""); // remove ending ```
  }

  try {
    var traits = JSON.parse(cleaned);
    Logger.log("Parsed traits: " + JSON.stringify(traits));
    return traits;
  } catch (e) {
    Logger.log("JSON parse failed: " + e.toString());
    return null;
  }
}


function testPersonalityTraits() {
  Logger.log("Beginning Test");
  inferPersonalityTraits("Dudley");
}

function updatePersonalityTraits(entityName, traits) {
  const fields = {};

  for (const trait in traits) {
    fields[trait] = { integerValue: traits[trait] };
  }

  const updatePayload = {
    CurrentPersonalityTraits: {
      mapValue: { fields: fields }
    }
  };

  return updateCatalogEntity("Characters", entityName, updatePayload);
}

function analyzeAndStoreTraits(entityName) {
  const traits = inferPersonalityTraits(entityName);
  if (traits) {
    const result = updatePersonalityTraits(entityName, traits);
    Logger.log("Updated CURRENT personality traits for " + entityName);
    return traits;
  } else {
    Logger.log("Could not infer traits for " + entityName);
    return null;
  }
}

function getOrInferCurrentPersonality(entityName) {
  const data = getCatalogEntity("Characters", entityName);
  if (data && data.CurrentPersonalityTraits) {
    return { current: wrapForRadarChart(data.CurrentPersonalityTraits) };
  }

  // Traits not found — generate them using OpenAI
  const traits = inferPersonalityTraits(entityName);
  if (!traits) return null;

  const formatted = {};
  for (const trait in traits) {
    formatted[trait] = { integerValue: traits[trait] };
  }

  return { current: formatted };
}

// Helper to wrap raw traits into { traitName: { integerValue: ... } } if they're not already
function wrapForRadarChart(traits) {
  const result = {};
  for (const key in traits) {
    result[key] = { integerValue: traits[key]?.integerValue || traits[key] || 50 };
  }
  return result;
}





function inferCharacterAttributes(entityName) {
  const matches = getParagraphsContainingCharacter(entityName);
  if (matches.length === 0) return null;

  const text = matches.join("\n\n");
  const prompt = `
Given the following character description, extract the following attributes. If a value cannot be determined, respond with "N/A". Return your response as a JSON object. Do not include explanations or markdown.

Attributes:
- HairColor
- EyeColor
- SkinColor
- Weight
- Build
- DistinctFeatures
- Height
- Gender
- Age
- Nationality

Text:
"""${text}"""
  `;

  const raw = callOpenAI(prompt);

  // Clean up and parse as JSON
  let response = raw.trim();
  if (response.startsWith("```")) {
    response = response.substring(response.indexOf("\n") + 1).replace(/```$/, "");
  }

  try {
    return JSON.parse(response);
  } catch (e) {
    Logger.log("Failed to parse character attributes: " + e.toString());
    Logger.log("Raw response:\n" + raw);
    return null;
  }
}

function getOrGenerateCharacterAttributes(entityName) {
  const existing = getCatalogEntity("Characters", entityName);
  const fields = [
    "HairColor", "EyeColor", "SkinColor", "Weight", "Build",
    "DistinctFeatures", "Height", "Gender", "Age", "Nationality"
  ];

  const result = {};
  let missing = false;

  fields.forEach(field => {
    const value = existing?.[field]?.stringValue;
    if (!value) missing = true;
    result[field] = value || "N/A";
  });

  if (!missing) return result;

  const generated = inferCharacterAttributes(entityName);
  return { ...result, ...generated };
}










async function listModels() {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAKy-8i8MxfD9B0Ec1TRS3blQBPBa4pWJs');
    const data = await response.json();
    if (data.models) {
        data.models.forEach(m => console.log(m.name));
    } else {
        console.log(data);
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}

listModels();

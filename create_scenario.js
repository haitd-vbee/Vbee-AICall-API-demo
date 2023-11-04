const jwt = require('jsonwebtoken');
const axios = require('axios');
const uuid = require('uuid');
const { camelizeKeys } = require('humps');

const baseUrl = 'https://aicall.vbee.ai';

const API_KEY = '<YOUR_API_KEY>';
const API_SECRET = '<YOUR_API_SECRET>';
const poolHotlineKey = '<YOUR_API_POOL_HOTLINE_KEY>';

const jwtToken = `Bearer ${jwt.sign({ apiKey: API_KEY }, API_SECRET)}`;

const createScenario = async () => {
  const url = `${baseUrl}/api/v1/public-api/scenarios`;
  const requestData = {
    name: `Scenario test demo ${uuid.v4()}`,
    ttsConfig: {
      voiceCode: 'hn_female_ngochuyen_full_48k-fhg',
    },
    callConfig: { poolHotlineKey },
    personalizedFields: [
      { name: 'Số tiền', readingType: 'CURRENCY' },
      { name: 'Ngày vay', readingType: 'DATE' },
      { name: 'Số chứng minh thư', readingType: 'SEQ2SEQ' },
    ],
  };

  const response = await axios.post(url, requestData, {
    headers: { Authorization: jwtToken },
  });
  return camelizeKeys(response.data?.result);
};

const getScenarioActions = async (scenarioId) => {
  const url = `${baseUrl}/api/v1/public-api/scenario-actions`;

  const response = await axios.get(url, {
    params: { scenarioId },
    headers: { Authorization: jwtToken },
  });

  return camelizeKeys(response.data?.result, { deep: true });
};

const main = async () => {
  const scenario = await createScenario();
  const actions = await getScenarioActions(scenario.id);

  console.log('Scenario action list', JSON.stringify(actions, null, 2));
};

main();

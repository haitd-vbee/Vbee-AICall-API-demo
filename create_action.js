const jwt = require("jsonwebtoken");
const axios = require("axios");
const uuid = require("uuid");
const { camelizeKeys } = require("humps");

const baseUrl = "https://aicall.vbee.ai";

const API_KEY = "<YOUR_API_KEY>";
const API_SECRET = "<YOUR_API_SECRET>";
const poolHotlineKey = "<YOUR_API_POOL_HOTLINE_KEY>";

const jwtToken = `Bearer ${jwt.sign({ apiKey: API_KEY }, API_SECRET)}`;

const createScenario = async () => {
  const url = `${baseUrl}/api/v1/public-api/scenarios`;
  const requestData = {
    name: `Scenario test demo ${uuid.v4()}`,
    ttsConfig: {
      voiceCode: "hn_female_ngochuyen_full_48k-fhg",
    },
    callConfig: { poolHotlineKey },
    personalizedFields: [
      { name: "Số tiền", readingType: "CURRENCY" },
      { name: "Ngày vay", readingType: "DATE" },
      { name: "Số chứng minh thư", readingType: "SEQ2SEQ" },
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

const createInteractiveMenuAction = async (action) => {
  const url = `${baseUrl}/api/v1/public-api/scenario-actions`;

  const response = await axios.post(url, action, {
    headers: { Authorization: jwtToken },
  });

  return camelizeKeys(response.data?.result, { deep: true });
};

const updateScenarioAction = async ({ id, ...actions }) => {
  const url = `${baseUrl}/api/v1/public-api/scenario-actions/${id}`;

  const response = await axios.put(url, actions, {
    headers: { Authorization: jwtToken },
  });

  return camelizeKeys(response.data?.result, { deep: true });
};

const main = async () => {
  const scenario = await createScenario();
  const actions = await getScenarioActions(scenario.id);

  // Lấy hành động gốc - system action outbound call
  const root = actions.find((action) => action.type === "OUTBOUND_CALL");

  // Lấy hành động đầu tiên khi khách hàng nghe máy
  const firstAction = actions.find(
    (action) => action.id === root.systemOutputs[0].nextActionId
  );

  // Thêm phím 1 vào danh sách phản hồi của của hành động đầu tiên
  await updateScenarioAction({
    id: firstAction.id,
    contentType: "TEXT",
    contentText:
      "Xin chào quý khách, đây là tổng đài CSKH nhân tạo, Mời bạn bấm phím 1 để nghe thông tin khuyến mãi",
    responseSetting: { responseType: "KEYPAD", timeout: 5 },
    responses: [{ keyPadMatch: "1" }],
  });

  // Tạo hành động xử lý khi phím 1 được nhấn
  const pressKey1Action = await createInteractiveMenuAction({
    scenarioId: scenario.id,
    label: "Phím 1",
    type: "INTERACTIVE_MENU",
    contentType: "TEXT",
    contentText: `Chương trình đi 4 tính tiền 3 trong vòng 1 tháng kể từ khi đăng ký hội viên`,
    responseSetting: { responseType: "KEYPAD" },
  });

  // Liên kết hành động pressKey1Action với phản hồi khi phím 5 được nhấn của hành động đầu tiên
  await updateScenarioAction({
    id: firstAction.id,
    responses: [{ keyPadMatch: "1", nextActionId: pressKey1Action.id }],
  });

  console.log("[Create scenario success]", `Created scenario: ${scenario.id}`);
};

main();

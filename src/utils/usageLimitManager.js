import * as FileSystem from 'expo-file-system/legacy';

const USAGE_FILE_URI = FileSystem.documentDirectory + 'usage_limits.json';
const DAILY_LIMIT = 50;

const getTodayString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const getUsageData = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(USAGE_FILE_URI);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(USAGE_FILE_URI);
      if (content) {
        return JSON.parse(content);
      }
    }
  } catch (error) {
    console.warn('Could not read usage data, creating new:', error);
  }
  return {};
};

const saveUsageData = async (data) => {
  try {
    await FileSystem.writeAsStringAsync(USAGE_FILE_URI, JSON.stringify(data));
  } catch (error) {
    console.error('Could not save usage data:', error);
  }
};

export const checkUsageLimit = async (type, amount = 1) => {
  const today = getTodayString();

  try {
    let data = await getUsageData();
    let currentData = data[type] || { date: today, count: 0 };

    if (currentData.date !== today) {
      currentData = { date: today, count: 0 };
    }

    if (currentData.count + amount > DAILY_LIMIT) {
      return { allowed: false, remaining: Math.max(0, DAILY_LIMIT - currentData.count) };
    }

    return { allowed: true, remaining: DAILY_LIMIT - currentData.count };
  } catch (error) {
    console.error('Error checking usage:', error);
    return { allowed: true, remaining: DAILY_LIMIT };
  }
};

export const incrementUsage = async (type, amount = 1) => {
  const today = getTodayString();

  try {
    let data = await getUsageData();
    let currentData = data[type] || { date: today, count: 0 };

    if (currentData.date !== today) {
      currentData = { date: today, count: 0 };
    }

    currentData.count += amount;
    data[type] = currentData;

    await saveUsageData(data);
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
};

export const getUsageStats = async (type) => {
  const today = getTodayString();

  try {
    let data = await getUsageData();
    let currentData = data[type] || { date: today, count: 0 };

    if (currentData.date !== today) {
      currentData = { date: today, count: 0 };
    }

    return { count: currentData.count, remaining: Math.max(0, DAILY_LIMIT - currentData.count) };
  } catch (error) {
    return { count: 0, remaining: DAILY_LIMIT };
  }
};

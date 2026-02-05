
const API_URL = 'http://107.172.218.124:3001/api/data';

export const vpsSync = {
  /**
   * 检查服务器是否在线
   */
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(id);
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  /**
   * 从 VPS 获取所有历史数据
   */
  async fetchData() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch data from VPS:', error);
      return null;
    }
  },

  /**
   * 将当前数据状态同步到 VPS
   */
  async saveData(data: any) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to save data to VPS:', error);
      return false;
    }
  }
};

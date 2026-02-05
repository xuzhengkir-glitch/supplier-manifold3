
const CLIENT_ID = 'YOUR_MICROSOFT_CLIENT_ID'; // 用户需要在这里填入自己的 Client ID
const SCOPES = ['Files.ReadWrite', 'User.Read'];
const REDIRECT_URI = window.location.origin + window.location.pathname;

export class OneDriveService {
  private token: string | null = null;

  constructor() {
    this.token = sessionStorage.getItem('od_token');
    this.handleAuthCallback();
  }

  private handleAuthCallback() {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      this.token = params.get('access_token');
      if (this.token) {
        sessionStorage.setItem('od_token', this.token);
        // 清理 URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  public login() {
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&response_mode=fragment`;
    window.location.href = authUrl;
  }

  public logout() {
    this.token = null;
    sessionStorage.removeItem('od_token');
  }

  private async fetchGraph(path: string, options: RequestInit = {}) {
    if (!this.token) throw new Error('Not authenticated');
    
    const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Session expired');
    }
    
    return response;
  }

  public async getUserInfo() {
    const res = await this.fetchGraph('/me');
    return res.json();
  }

  public async uploadData(data: any) {
    const content = JSON.stringify(data);
    const path = `/me/drive/root:/Apps/MeasurementInsightsPro/repository.json:/content`;
    return this.fetchGraph(path, {
      method: 'PUT',
      body: content
    });
  }

  public async downloadData() {
    try {
      const path = `/me/drive/root:/Apps/MeasurementInsightsPro/repository.json`;
      const metaRes = await this.fetchGraph(path);
      if (!metaRes.ok) return null;
      
      const meta = await metaRes.json();
      const downloadUrl = meta['@microsoft.graph.downloadUrl'];
      const contentRes = await fetch(downloadUrl);
      return contentRes.json();
    } catch (e) {
      return null;
    }
  }
}

export const oneDrive = new OneDriveService();

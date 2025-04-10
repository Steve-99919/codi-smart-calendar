
declare interface Window {
  gapi: {
    load: (api: string, callback: () => void) => void;
    client: {
      init: (options: {
        clientId: string;
        discoveryDocs?: string[];
        scope?: string;
        apiKey?: string;
      }) => Promise<void>;
      calendar: {
        events: {
          insert: (params: {
            calendarId: string;
            resource: any;
          }) => Promise<any>;
          list: (params: {
            calendarId: string;
            timeMin: string;
            timeMax: string;
            showDeleted?: boolean;
            singleEvents?: boolean;
            maxResults?: number;
            orderBy?: string;
          }) => Promise<any>;
        };
      };
    };
    auth2: {
      getAuthInstance: () => {
        isSignedIn: {
          listen: (callback: (isSignedIn: boolean) => void) => void;
          get: () => boolean;
        };
        signIn: () => Promise<any>;
        signOut: () => Promise<any>;
        currentUser: {
          get: () => {
            getBasicProfile: () => {
              getName: () => string;
              getEmail: () => string;
              getImageUrl: () => string;
            };
          };
        };
      };
    };
  };
}


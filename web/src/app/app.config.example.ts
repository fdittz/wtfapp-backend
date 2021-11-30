export class Config  {
  static getConfig() {
    return {
      apiKey: "<YOUR_API_KEY>",
      authDomain: "<FIREBASE_DOMAIN_AUTH>",
      databaseURL: "<FIREBASE_DATABASE_URL>",
      projectId: "<FIREBASE_PROJECT_ID>",
      storageBucket: "<STORAGEID>",
      messagingSenderId: "<MSGSENDERID>"
    }
  }
};

export type RootStackParamList = {
    Login: undefined;
    Signup: undefined;
    MainTabs: undefined;
    Profile: { userId: number };
    Connections: { tab?: "seguidores" | "seguindo" };
};

export type MainTabParamList = {
    Home: undefined;
    Explore: undefined;
    MyProfile: undefined;
};

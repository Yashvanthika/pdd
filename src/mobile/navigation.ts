export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  RegisterProfile: undefined;
};

export type AppStackParamList = {
  Search: undefined;
  Results: {
    bloodGroup: string;
    state: string;
    district: string;
    city: string;
  };
  MyPage: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  LastDonation: undefined;
};

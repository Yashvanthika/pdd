export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  RegisterPhone: undefined;
  RegisterProfile: {
    phone: string;
    firebaseIdToken: string;
  };
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

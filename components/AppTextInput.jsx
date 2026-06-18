// import {
//   StyleSheet,
//   Text,
//   TextInput,
//   TextInputProps,
//   View,
// } from "react-native";
// import React, { useState } from "react";
// import Colors from "../constants/Colors";
// import Font from "../constants/Font";
// import FontSize from "../constants/FontSize";
// import Spacing from "../constants/Spacing";

// const AppTextInput = ({ placeholder, onChangeText, label, type }) => {
//   const [focused, setFocused] = useState(false);
//   return (
//     <>
//       <Text
//         style={{
//           fontFamily: Font["poppins-bold"],
//           fontSize: FontSize.medium,
//           color: focused ? Colors.primary : "F1F4F7",
//           marginLeft: 20,
//           marginBottom: 5,
//           marginTop: "2%",
//         }}
//       >
//         {label}
//       </Text>
//       <TextInput
//         onFocus={() => setFocused(true)}
//         onBlur={() => setFocused(false)}
//         placeholderTextColor={Colors.darkText}
//         style={[
//           {
//             fontFamily: Font["poppins-regular"],
//             fontSize: FontSize.small,
//             paddingVertical: 20,
//             paddingHorizontal: 20,
//             backgroundColor: "#F1F4F7",
//             // borderRadius: Spacing,
//             // marginVertical: Spacing,
//             // borderBottomWidth: 1,
//             borderColor: Colors.darkText,
//             marginBottom: "1%",
//             fontSize: 18,
//             borderRadius: 30,
//             borderWidth: 3,
//             borderColor: Colors.gray,
//           },
//           focused && {
//             borderWidth: 3,
//             borderColor: Colors.primary,
//             shadowOffset: { width: 4, height: Spacing },
//             shadowColor: Colors.primary,
//             shadowOpacity: 0.2,
//             shadowRadius: Spacing,
//           },
//         ]}
//         // {...otherProps}
//         placeholder={placeholder}
//         onChangeText={onChangeText}
//         secureTextEntry={type === "password" ? true : false}
//       />
//     </>
//   );
// };

// export default AppTextInput;

// const styles = StyleSheet.create({});
import { StyleSheet, Text, TextInput, View } from "react-native";
import React, { useState } from "react";
import Colors from "../constants/Colors";
import Font from "../constants/Font";
import FontSize from "../constants/FontSize";
import Spacing from "../constants/Spacing";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../constants/Scale";

const AppTextInput = ({ placeholder, onChangeText, label, type }) => {
  const [focused, setFocused] = useState(false);

  return (
    <>
      <Text
        style={{
          fontFamily: Font["poppins-bold"],
          fontSize: moderateScale(FontSize.medium),
          color: focused ? Colors.primary : "F1F4F7",
          marginLeft: horizontalScale(20),
          marginBottom: verticalScale(5),
          marginTop: verticalScale(10),
        }}
      >
        {label}
      </Text>
      <TextInput
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={Colors.darkText}
        style={[
          {
            fontFamily: Font["poppins-regular"],
            fontSize: moderateScale(FontSize.small),
            paddingVertical: verticalScale(18),
            paddingHorizontal: horizontalScale(20),
            backgroundColor: "#F1F4F7",
            borderRadius: moderateScale(30),
            marginBottom: verticalScale(10),
            borderWidth: horizontalScale(3),
            borderColor: Colors.gray,
          },
          focused && {
            borderWidth: horizontalScale(3),
            borderColor: Colors.primary,
            shadowOffset: {
              width: horizontalScale(4),
              height: verticalScale(Spacing),
            },
            shadowColor: Colors.primary,
            shadowOpacity: 0.2,
            shadowRadius: moderateScale(Spacing),
          },
        ]}
        placeholder={placeholder}
        onChangeText={onChangeText}
        secureTextEntry={type === "password"}
      />
    </>
  );
};

export default AppTextInput;

const styles = StyleSheet.create({});

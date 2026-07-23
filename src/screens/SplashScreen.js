import { StyleSheet, View, Text, ActivityIndicator, Dimensions, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 1080;

export default function SplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Logo — Group 110.png at X:340, Y:921, W:401, H:385.37 */}
      <Image
        source={
          Platform.OS === 'ios'
            ? Image.resolveAssetSource(require('../components/group_110.png'))
            : require('../components/Group 110.png')
        }
        style={styles.logo}
        resizeMode="contain"
      />

      {/* App Name — "Reverse Image Search" at X:240, Y:1425, W:600, H:84 */}
      <Text 
        style={styles.appName} 
        numberOfLines={1} 
        adjustsFontSizeToFit={true}
      >
        Reverse Image Search
      </Text>

      {/* Spinner at bottom */}
      <View style={[styles.spinnerContainer, { bottom: Math.max(insets.bottom + (10 * scale), 20 * scale) }]}>
        <ActivityIndicator size="small" color="#29BD4F" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  logo: {
    position: 'absolute',
    left: 340 * scale,
    top: 921 * scale,
    width: Platform.OS === 'ios' ? Math.round(401 * scale) : 401 * scale,
    height: Platform.OS === 'ios' ? Math.round(385.37 * scale) : 385.37 * scale,
    resizeMode: 'contain',
  },
  appName: {
    position: 'absolute',
    left: 240 * scale,
    top: 1425 * scale,
    width: 600 * scale,
    height: 84 * scale,
    fontFamily: 'Jua',
    fontWeight: '400',
    fontSize: 55.55 * scale,
    lineHeight: 55.55 * scale * 1.52,
    letterSpacing: 55.55 * scale * 0.065,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  spinnerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 120 * scale,
    alignItems: 'center',
  },
});

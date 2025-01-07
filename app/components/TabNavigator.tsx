import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../(tabs)/index';
import MyBidsScreen from '../(bid)/my-bids';       // Correct import path
import MyProductsScreen from '../(tabs)/my-products';
import BidsOnMyProductsScreen from '../(bid)/bids-on-my-products';
import ProfileScreen from '../(tabs)/profile';
// ...other imports...

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="My Bids" component={MyBidsScreen} />
            <Tab.Screen name="My Products" component={MyProductsScreen} />
            <Tab.Screen name="Bids On My Products" component={BidsOnMyProductsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

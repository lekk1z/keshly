import {Tabs} from 'expo-router';
import Ioicons from '@expo/vector-icons/Ionicons';

export default function TabsLayout() {
    return (
        <Tabs
        screenOptions={{
            headerStyle:{backgroundColor:'#e6e6e6'},
            headerShadowVisible:false,
            headerTintColor:'#000',
            tabBarStyle:{
                backgroundColor:'#e6e6e6',
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
            <Ioicons
              name={focused ? "home-sharp" : "home-outline"}
              color={color}
              size={24}
            />),}}
            />

            <Tabs.Screen
            name='scan'
            options={{
                title:'Dodaj Racun',
                tabBarIcon: ({ color, focused }) => (
                    <Ioicons
                      name={focused ? "add-sharp" : "add-outline"}
                      color={color}
                      size={24}
                    />),}}
            />
            <Tabs.Screen
            name="stats"
            options={{
                title:'Statistika potrosnje',
                tabBarIcon: ({ color, focused }) => (
                    <Ioicons
                      name={focused ? "stats-chart-sharp" : "stats-chart-outline"}
                      color={color}
                      size={24}
                    />),
            }} />
            <Tabs.Screen
            name="usersettings"
            options={{
                title:'Korisnik',
                tabBarIcon: ({ color, focused }) => (
                    <Ioicons
                      name={focused ? "person-sharp" : "person-outline"}
                      color={color}
                      size={24}
                    />),}}
            />
        </Tabs>)}
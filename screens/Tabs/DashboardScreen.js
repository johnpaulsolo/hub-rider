import React, { Component } from 'react';
import { StyleSheet, ScrollView, FlatList, ActivityIndicator, Linking, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EditScreenInfo from '../../components/EditScreenInfo';
import { View } from '../../components/Themed';
import { Card, Button, Icon, Text, Badge } from 'react-native-elements';
import {NavigationApps,actions,googleMapsTravelModes} from "react-native-navigation-apps";
import Geocoder from 'react-native-geocoding';
import Geofence from 'react-native-expo-geofence';
import * as Location from 'expo-location';
import { Permissions } from 'expo';
import axios from 'axios';

export default class TabOneScreen extends Component {
  constructor(props) {
    super(props);

    this._isMounted = false;

    this.state = {
      userId: null,
      hubStation: null,
      allRequest: [],
      fencedRequest: [],
      currentLocation: {
        longitude: 'unknown', //Initial Longitude
        latitude: 'unknown', //Initial Latitude
      },
      loading: true,
      activeBooking: false,
      activeBookingDetails: null,
      submitBtn: false
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidMount = async () => {
    this._isMounted = true;
    
    await AsyncStorage.getItem('userId').then(result => {
      result ? this.setState({ userId: result }) : this.props.navigation.navigate('Login');
    })

    await axios({
      url: 'https://serene-cliffs-80945.herokuapp.com/api',
      method: 'POST',
      data: {
        query: `
          {
            Profile(userId:"${this.state.userId}") {
              Hub
            }
          }
        `
      }
    }).then(result => {
      this.setState({
        hubStation: result.data.data.Profile.Hub
      })
    }).catch(err => {
      alert(err)
    });

    await axios({
      url: 'https://serene-cliffs-80945.herokuapp.com/api',
      method: 'POST',
      data: {
          query: `
            {
              DriverTrip(userId:"${this.state.userId}"){
                _id
                PickAddress
                DropAddress
                DropLat
                DropLong
                PickLat
                PickLong
                Notes
                UserId {
                  FName
                  LName
                  Username
                  Email
                  Phone
                }
              }
            }
          `
      }
    }).then(result => {
      result.data.data.DriverTrip == null ?
        this.setState({
          activeBooking: false
        })
      :
        this.setState({
          activeBooking: true,
          activeBookingDetails: result.data.data.DriverTrip
        })
    }).catch( err => {
      this.setState({
        activeBooking: false
      })
    })

    await navigator.geolocation.getCurrentPosition(
      //Will give you the current location
      position => {
        const currentLongitude = JSON.stringify(position.coords.longitude);
        //getting the Longitude from the location json

        const currentLatitude = JSON.stringify(position.coords.latitude);
        //getting the Latitude from the location json

        this.setState({ 
          currentLocation: {
            latitude: currentLatitude,
            longitude: currentLongitude
          }
        });

        axios({
          url: 'https://serene-cliffs-80945.herokuapp.com/api',
          method: 'POST',
          data: {
              query: `
                {
                  RequestTransactions{
                    _id
                    UserId{
                      FName
                      LName
                      Email
                      Phone
                    }
                    PickAddress
                    DropAddress
                    DropLat
                    DropLong
                    PickLat
                    PickLong
                    Notes
                    Status
                    Driver{
                      _id
                    }
                  }
                }
              `
          }
        }).then(result => {
          if (result.data.data.RequestTransactions.length == 0) {
            this.setState({
              loading: false
            })
          } else {
            result.data.data.RequestTransactions.reverse().map(res => {
              
              var maxDistanceInKM = 10; // 500m distance
              // startPoint - center of perimeter
              // points - array of points
              // maxDistanceInKM - max point distance from startPoint in KM's
              // result - array of points inside the max distance
              var result = Geofence.filterByProximity(this.state.currentLocation, [{latitude: res.PickLat, longitude: res.PickLong}], maxDistanceInKM);
              console.log(result)

              result[0] ? 
                this.setState({
                  allRequest: [...this.state.allRequest, {
                    UserId: res.UserId,
                    DropLat: res.DropLat,
                    DropLong: res.DropLong,
                    DropAddress: res.DropAddress,
                    PickAddress: res.PickAddress,
                    PickLat: res.PickLat,
                    PickLong: res.PickLong,
                    Notes: res.Notes,
                    Status: res.Status,
                    Driver: res.Driver,
                    _id: res._id
                  }],
                  loading: false
                })
              : null
            })
          }

          // !this.state.activeBooking ? this._reload() : null
        }).catch(err => {
            alert(err)
        })
      },
      error => alert(error.message),
      { enableHighAccuracy: true, timeout: 1000, maximumAge: 1000 }
    );

  }

  _reload = () => {
    this.setState({
      allRequest: [],
      loading: false
    });
    
    axios({
      url: 'https://serene-cliffs-80945.herokuapp.com/api',
      method: 'POST',
      data: {
          query: `
            {
              RequestTransactions{
                _id
                UserId{
                  FName
                  LName
                  Email
                }
                PickAddress
                DropAddress
                DropLat
                DropLong
                PickLat
                PickLong
                Notes
                Status
                Driver{
                  _id
                }
              }
            }
          `
      }
    }).then(result => { 

      if (result.data.data.RequestTransactions.length == 0) {
        this.setState({
          loading: false
        })
      } else {
        result.data.data.RequestTransactions.reverse().map(res => {
                
          var maxDistanceInKM = 10; // 500m distance
          // startPoint - center of perimeter
          // points - array of points
          // maxDistanceInKM - max point distance from startPoint in KM's
          // result - array of points inside the max distance
          var result = Geofence.filterByProximity(this.state.currentLocation, [{latitude: res.PickLat, longitude: res.PickLong}], maxDistanceInKM);

          result[0] ? 
            this.setState({
              allRequest: [...this.state.allRequest, {
                UserId: res.UserId,
                DropLat: res.DropLat,
                DropLong: res.DropLong,
                DropAddress: res.DropAddress,
                PickAddress: res.PickAddress,
                PickLat: res.PickLat,
                PickLong: res.PickLong,
                Notes: res.Notes,
                Status: res.Status,
                Driver: res.Driver,
                _id: res._id
              }],
              loading: false
            })
          : null
        })
      }
    }).catch(err => {
        alert(err)
    })
  }

  _activateTrip = () => {
    axios({
      url: 'https://serene-cliffs-80945.herokuapp.com/api',
      method: 'POST',
      data: {
          query: `
            {
              DriverTrip(userId:"${this.state.userId}"){
                _id
                PickAddress
                DropAddress
                DropLat
                DropLong
                PickLat
                PickLong
                Notes
                UserId {
                  FName
                  LName
                  Username
                  Email
                  Phone
                }
              }
            }
          `
      }
    }).then(result => {
      result.data.data.DriverTrip == null ?
        this.setState({
          activeBooking: false
        })
      :
        this.setState({
          activeBooking: true,
          activeBookingDetails: result.data.data.DriverTrip
        })
    }).catch( err => {
      this.setState({
        activeBooking: false
      })
    })
  }

  _accept = (id) => {
    this.setState({
      submitBtn: true
    })
    
    axios({
      url: 'https://serene-cliffs-80945.herokuapp.com/api',
      method: 'POST',
      data: {
          query: `
            mutation {
              EditStatus(account: "${id}", status: "Accepted", rider: "${this.state.userId}", hub: "${this.state.hubStation}"){
                Status
              }  
            }
          `
      }
    }).then(result => {
        this._activateTrip()
        this.setState({
          submitBtn: false
        })
    }).catch(err => {
        alert(err)
    })
  }

  _finishTrip = (id) => {
    axios({
      url: 'https://serene-cliffs-80945.herokuapp.com/api',
      method: 'POST',
      data: {
          query: `
            mutation {
              EditStatus(account: "${id}", status: "Completed", rider: "${this.state.userId}"){
                Status
              }  
            }
          `
      }
    }).then(result => {
        this.setState({
          activeBooking: false
        })
        this._reload()
    }).catch(err => {
        alert(err)
    })
  }

  render () {

    const {
      activeBookingDetails
    } = this.state

    return (
      <View style={styles.container}>
        {
            !this.state.loading ? 
              this.state.activeBooking ?
                <View> 
                  <Card>
                    <Card.Title><Text h1>Active Request</Text></Card.Title>
                    <Text h4 style={{ color: 'black'}}>Name: {activeBookingDetails.UserId.FName} {activeBookingDetails.UserId.LName}</Text>
                    <Text h4 style={{ color: 'black'}}>Phone: <TouchableOpacity  onPress={() => Linking.openURL(`tel:${activeBookingDetails.UserId.Phone}`)}><Text>{activeBookingDetails.UserId.Phone}</Text></TouchableOpacity></Text>
                    <Text style={{marginBottom: 10, color: 'black'}}>Pickup address: {activeBookingDetails.PickAddress}</Text>
                    <NavigationApps
                        iconSize={50}
                        row
                        address={activeBookingDetails.PickAddress} // address to navigate by for all apps 
                        googleMaps={{activeBookingDetails: activeBookingDetails.PickLat, lon: activeBookingDetails.PickLong, action: actions.navigateByAddress, travelMode: 'driving'}}
                        waze={{address: activeBookingDetails.PickAddress, lat: activeBookingDetails.PickLat, lon: activeBookingDetails.PickLong, action: actions.navigateByLatAndLon, travelMode: 'driving'}} // specific settings for waze
                    />
                    <Text style={{marginBottom: 10, color: 'black'}}>Drop Off address: {activeBookingDetails.DropAddress}</Text>
                    <NavigationApps
                        iconSize={50}
                        row
                        address={activeBookingDetails.DropAddress} // address to navigate by for all apps 
                        googleMaps={{address: activeBookingDetails.DropAddress, lat: activeBookingDetails.DropLat, lon: activeBookingDetails.DropLong, action: actions.navigateByAddress, travelMode: 'driving'}}
                        waze={{address: activeBookingDetails.DropAddress, lat: activeBookingDetails.DropLat, lon: activeBookingDetails.DropLong, action: actions.navigateByLatAndLon, travelMode: 'driving'}} // specific settings for waze
                    />

                    <Button
                      disabled={this.state.submitBtn}
                      title='Finish Trip'
                      onPress={() => this._finishTrip(activeBookingDetails._id)}
                    />
                  </Card>
                </View>
              :
                <View>
                  <Button
                    title='refresh'
                    onPress={() => this._reload()}
                  />
                  <FlatList
                    style={{ paddingBottom: 10 }}
                    data={this.state.allRequest}
                    renderItem={({item}) => 
                          <Card containerStyle={styles.Cards}>
                            <Card.Title><Text h1>{ item.UserId.FName } { item.UserId.LName }</Text> {<Text>{item.Status}</Text>}</Card.Title>
                              <Card.Divider/>
                              {/* <Text style={{marginBottom: 10, color: 'black'}}>{item.HubLocated}</Text> */}
                              {/* <Text style={{marginBottom: 10, color: 'black'}}>{JSON.stringify(item)}</Text> */}
                              <Text h4 style={{ color: 'black'}}>Email: {item.UserId.Email}</Text>
                              <Text h4 style={{ color: 'black'}}>Extra Notes: {item.Notes == "null" ? "No extra notes" : item.Notes}</Text>

                              {item.Status == 'Accepted' ?
                                  <Card>
                                    <Text style={{marginBottom: 10, color: 'black'}}>{item.PickAddress}</Text>
                                    <NavigationApps
                                        iconSize={50}
                                        row
                                        address={item.PickAddress} // address to navigate by for all apps 
                                        googleMaps={{lat: item.PickLat, lon: item.PickLong, action: actions.navigateByAddress, travelMode: 'driving'}}
                                        waze={{address: item.PickAddress, lat: item.PickLat, lon: item.PickLong, action: actions.navigateByLatAndLon, travelMode: 'driving'}} // specific settings for waze
                                    />
                                    <Text style={{marginBottom: 10, color: 'black'}}>{item.DropAddress}</Text>
                                    <NavigationApps
                                        iconSize={50}
                                        row
                                        address={item.DropAddress} // address to navigate by for all apps 
                                        googleMaps={{address: item.DropAddress, lat: item.DropLat, lon: item.DropLong, action: actions.navigateByAddress, travelMode: 'driving'}}
                                        waze={{address: item.DropAddress, lat: item.DropLat, lon: item.DropLong, action: actions.navigateByLatAndLon, travelMode: 'driving'}} // specific settings for waze
                                    />
                                  </Card>
                                :
                                  null
                              }

                              {
                                item.Status == 'Pending' ?
                                  <Button
                                    disabled={this.state.submitBtn}
                                    title='Accept'
                                    onPress={() => this._accept(item._id)}
                                  />
                                  :
                                    item.Status == 'Accepted' ?
                                      <Button
                                        title='Finish Trip'
                                        onPress={() => this._finishTrip(item._id)}
                                      />
                                    : null
                              }
                          </Card>
                    }
                  />
                </View>
            :
              <Card><ActivityIndicator></ActivityIndicator></Card>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});

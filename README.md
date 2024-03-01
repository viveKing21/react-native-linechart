# React Native LineChart

## Overview

The LineChart component is a versatile and customizable charting tool designed for visualizing data trends over a continuous range. It offers a clear and concise representation of data points plotted on a Cartesian coordinate system, with points connected by straight line segments.

## Installation

```
npm install react-native-linechart react-native-svg
yarn add react-native-linechart react-native-svg
```

# Usage

## 1. Screenshots

```javascript import React from 'react';
import { View } from 'react-native';
import LineChart from './LineChart'; // Assuming this is the path to your LineChart component

const data = {
    values: [],
    hideDot
}

const ChartExample = () => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <LineChart
        dataset={[data]}
        width={300} // Specify the width of your chart
        height={200} // Specify the height of your chart
        // Other props as needed...
      />
    </View>
  );
}
```

# Configuration

Make sure to configure the Stripe secret key in your application properties:

`stripe.secretKey=your_stripe_secret_key_here`

# Payment Handling UI

## Overview

This UI provides a seamless and secure way to handle payments by leveraging the Stripe Payment Service API. The interface is designed to automate the payment process, eliminating the need to directly pass card details to the SDK. Users can initiate payments through the UI, which will automatically capture and process the payment. The UI provides real-time feedback on the payment status, distinguishing between successful transactions and failed attempts. With a user-friendly design, this UI enhances the payment experience while ensuring the security and efficiency of the payment flow.

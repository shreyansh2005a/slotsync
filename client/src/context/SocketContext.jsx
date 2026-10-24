import React, { createContext, useContext, useState, useEffect } from 'react';
import socket from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [latestAlert, setLatestAlert] = useState(null);
  const [activeUsersCount, setActiveUsersCount] = useState(1);

  useEffect(() => {
    if (user) {
      socket.emit('join_user_room', user._id);
      socket.emit('join_role_room', user.role);
    }

    socket.on('schedule_published', (data) => {
      setLatestAlert({
        type: 'SUCCESS',
        title: 'New Schedule Version Published!',
        message: `Version ${data.version} has been published with ${data.interviewsCount} interviews.`
      });
    });

    socket.on('interview_booked', (data) => {
      setLatestAlert({
        type: 'INFO',
        title: 'Slot Reserved by Candidate',
        message: `${data.candidateName} booked a slot for ${new Date(data.startTime).toLocaleString()}.`
      });
    });

    socket.on('disruption_alert', (data) => {
      setLatestAlert({
        type: 'WARNING',
        title: 'Schedule Disruption Detected',
        message: `An interview was cancelled or invalidated. Automated recovery proposal ready.`
      });
    });

    return () => {
      socket.off('schedule_published');
      socket.off('interview_booked');
      socket.off('disruption_alert');
    };
  }, [user]);

  const clearAlert = () => setLatestAlert(null);

  return (
    <SocketContext.Provider value={{ socket, latestAlert, clearAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

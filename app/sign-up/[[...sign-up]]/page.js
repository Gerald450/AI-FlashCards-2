import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import {SignUp} from '@clerk/nextjs'
import Navigation from '../../components/Navigation';

export default function SignUpPage() {
    return (
        <>
            <Navigation />
            <Container maxWidth="sm">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '70vh',
                        py: 6,
                    }}
                >
                    <Typography variant='h3' sx={{ mb: 4, fontWeight: 700 }}>
                        Sign Up
                    </Typography>
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <SignUp />
                    </Box>
                </Box>
            </Container>
        </>
    )
}
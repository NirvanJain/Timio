package com.nirvanjain.timio

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.nirvanjain.timio.ui.theme.TimioTheme
import com.nirvanjain.timio.ui.MainScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TimioTheme {
                MainScreen()
            }
        }
    }
}

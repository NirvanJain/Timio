package com.nirvanjain.timio.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.map
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFF000000),
    onPrimary = Color.White,
    background = Color.White,
    onBackground = Color.Black,
    surface = Color.White,
    onSurface = Color.Black
)

private val DarkColors = darkColorScheme(
    primary = Color.White,
    onPrimary = Color.Black,
    background = Color.Black,
    onBackground = Color.White,
    surface = Color.Black,
    onSurface = Color.White
)

private val ThemePreferenceKey = booleanPreferencesKey("dark_theme")

private val Context.dataStore by preferencesDataStore(name = "timio_prefs")

@Composable
fun TimioTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // Observe persisted theme preference
    val savedTheme = androidx.compose.runtime.remember {
        mutableStateOf(darkTheme)
    }
    // Store changes
    androidx.compose.runtime.LaunchedEffect(savedTheme.value) {
        // Store preference
        val ctx = androidx.compose.ui.platform.LocalContext.current
        ctx.dataStore.edit { prefs ->
            prefs[ThemePreferenceKey] = savedTheme.value
        }
    }
    val colors: ColorScheme = if (savedTheme.value) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = androidx.compose.material3.Typography(),
        content = content
    )
}

// Helper to read persisted theme (optional, can be used elsewhere)
@Composable
fun rememberThemeState(): androidx.compose.runtime.MutableState<Boolean> {
    val context = androidx.compose.ui.platform.LocalContext.current
    val themeState = androidx.compose.runtime.remember { mutableStateOf(isSystemInDarkTheme()) }
    androidx.compose.runtime.LaunchedEffect(Unit) {
        context.dataStore.data.map { prefs -> prefs[ThemePreferenceKey] ?: isSystemInDarkTheme() }
            .collect { saved -> themeState.value = saved }
    }
    return themeState
}

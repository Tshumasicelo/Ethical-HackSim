# The web game calls these methods by name through addJavascriptInterface,
# so they must survive shrinking if minification is ever switched on.
-keepclassmembers class com.rt.hacksim.AndroidBridge {
    @android.webkit.JavascriptInterface <methods>;
}

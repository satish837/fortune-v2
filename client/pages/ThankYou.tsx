import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Heart, Sparkles, Trophy } from "lucide-react";

export default function ThankYou() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
              </div>
            </div>
            
            <CardTitle className="text-4xl font-bold text-gray-800 mb-4">
              Thank You! 🙏
            </CardTitle>
            
            <CardDescription className="text-xl text-gray-600 leading-relaxed">
              The #DiwaliKaFortune Postcard Experience has officially concluded!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-amber-600">
                <Heart className="w-5 h-5" />
                <span className="font-semibold">Campaign Closed</span>
              </div>
              
              <p className="text-gray-700 leading-relaxed">
                We're overwhelmed by the incredible response to our Diwali postcard campaign! 
                Thousands of beautiful, personalized postcards were created, spreading joy and 
                festive cheer across the nation.
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Trophy className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-800">What's Next?</h3>
              </div>
              
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Winners will be announced soon on our official channels</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Keep an eye on your email for winner notifications</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>Follow us on social media for more exciting campaigns</span>
                </li>
              </ul>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Thank you for being part of this magical Diwali celebration with Fortune Foods!
              </p>
            </div>

            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Powered by <span className="font-semibold text-orange-600">Fortune Foods</span> • 
                <span className="mx-2">#DiwaliKaFortune</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

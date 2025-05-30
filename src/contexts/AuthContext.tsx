
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { auth, getPlayerProfile, PlayerProfile } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  user: User | null;
  playerProfile: PlayerProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  playerProfile: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        try {
          console.log("Fetching player profile for:", user.uid);
          const profile = await getPlayerProfile(user.uid);
          console.log("Profile data:", profile);
          
          if (!profile) {
            // Create a default profile if none exists
            console.log("No profile found, creating a default one");
            const defaultProfile: PlayerProfile = {
              uid: user.uid,
              email: user.email || "",
              name: user.displayName || "Usuário",
              createdAt: new Date(),
              isAdmin: false, // Set default admin status to false
              stats: {
                matches: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                tournaments: 0,
                podiums: 0,
                aces: 0,
                winningStreak: 0,
                consistencyScore: 0
              }
            };
            setPlayerProfile(defaultProfile);
          } else {
            setPlayerProfile(profile as PlayerProfile);
          }
        } catch (error) {
          console.error("Error fetching player profile:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar seu perfil. Tente novamente mais tarde.",
            variant: "destructive",
          });
        }
      } else {
        setPlayerProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const value = {
    user,
    playerProfile,
    loading,
    isAdmin: playerProfile?.isAdmin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

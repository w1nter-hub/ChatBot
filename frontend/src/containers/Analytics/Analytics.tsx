import React from "react";
import {
  Box,
  Flex,
  Grid,
  Heading,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getChatSessions,
  getOfflineMessages,
  getTrainingData,
} from "../../services/knowledgebaseService";
import {
  ChatSession,
  OfflineMessage,
  TrainingDataDetail,
} from "../../types/knowledgebase.type";

interface AnalyticsProps {
  chatbotId: string;
  crawledPages?: number;
  failedPages?: number;
}

const KPI_TARGETS = {
  aiResolutionRate: 70,
  offlineShare: 25,
  kbCoverage: 80,
};

export const Analytics = ({
  chatbotId,
  crawledPages = 0,
  failedPages = 0,
}: AnalyticsProps) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [offlineMessages, setOfflineMessages] = React.useState<OfflineMessage[]>(
    [],
  );
  const [trainingData, setTrainingData] = React.useState<TrainingDataDetail[]>(
    [],
  );

  React.useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setIsLoading(true);
        const [sessionsResp, offlineResp, trainingResp] = await Promise.all([
          getChatSessions(chatbotId, "1"),
          getOfflineMessages(chatbotId, "1"),
          getTrainingData(chatbotId, "1"),
        ]);
        setSessions(sessionsResp.data.results || []);
        setOfflineMessages(offlineResp.data.results || []);
        setTrainingData(trainingResp.data.results || []);
      } catch (error) {
        console.log("Unable to fetch analytics data", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalyticsData();
  }, [chatbotId]);

  const totalSessions = sessions.length;
  const totalOffline = offlineMessages.length;
  const totalCrawled = crawledPages + failedPages;
  const aiResolved = Math.max(totalSessions - totalOffline, 0);
  const aiResolutionRate = totalSessions ? (aiResolved * 100) / totalSessions : 0;
  const offlineShare = totalSessions ? (totalOffline * 100) / totalSessions : 0;
  const kbCoverage = totalCrawled ? (crawledPages * 100) / totalCrawled : 0;

  const supportFlowData = [
    { name: "AI шешкен", value: aiResolved },
    { name: "Офлайн/эскалация", value: totalOffline },
  ];

  const knowledgeData = [
    { name: "Сканерленген", value: crawledPages },
    { name: "Сәтсіз", value: failedPages },
    { name: "Арнайы Q&A", value: trainingData.length },
  ];

  const targetComparison = [
    {
      name: "AI шешу үлесі",
      current: Number(aiResolutionRate.toFixed(1)),
      target: KPI_TARGETS.aiResolutionRate,
    },
    {
      name: "Офлайн үлесі",
      current: Number(offlineShare.toFixed(1)),
      target: KPI_TARGETS.offlineShare,
    },
    {
      name: "Білім базасы қамтуы",
      current: Number(kbCoverage.toFixed(1)),
      target: KPI_TARGETS.kbCoverage,
    },
  ];

  if (isLoading) {
    return (
      <Flex h="100%" alignItems="center" justifyContent="center" minH="320px">
        <Spinner />
      </Flex>
    );
  }

  return (
    <Box>
      <Heading fontSize="lg" mb="2">
        Аналитика
      </Heading>
      <Text color="gray.600" fontSize="sm" mb="6">
        Қолдау сапасы бойынша KPI көрсеткіштері.
      </Text>

      <SimpleGrid columns={[1, 1, 2, 4]} spacing={4} mb={6}>
        <Stat p="4" border="1px solid" borderColor="gray.100" borderRadius="md">
          <StatLabel>Жалпы сессия</StatLabel>
          <StatNumber>{totalSessions}</StatNumber>
          <StatHelpText>Соңғы бет дерегі</StatHelpText>
        </Stat>
        <Stat p="4" border="1px solid" borderColor="gray.100" borderRadius="md">
          <StatLabel>AI шешу пайызы</StatLabel>
          <StatNumber>{aiResolutionRate.toFixed(1)}%</StatNumber>
          <StatHelpText>Мақсат: {KPI_TARGETS.aiResolutionRate}%</StatHelpText>
        </Stat>
        <Stat p="4" border="1px solid" borderColor="gray.100" borderRadius="md">
          <StatLabel>Офлайн үлесі</StatLabel>
          <StatNumber>{offlineShare.toFixed(1)}%</StatNumber>
          <StatHelpText>Мақсат: {KPI_TARGETS.offlineShare}%</StatHelpText>
        </Stat>
        <Stat p="4" border="1px solid" borderColor="gray.100" borderRadius="md">
          <StatLabel>Білім базасы қамтуы</StatLabel>
          <StatNumber>{kbCoverage.toFixed(1)}%</StatNumber>
          <StatHelpText>Сканерленген / сәтсіз беттер</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Grid templateColumns={["1fr", "1fr", "1fr 1fr"]} gap={5}>
        <Box
          p="4"
          border="1px solid"
          borderColor="gray.100"
          borderRadius="md"
          minH="320px"
        >
          <Heading fontSize="sm" mb="4">
            Қолдау ағынының үлестірімі
          </Heading>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={supportFlowData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                fill="#3182ce"
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        <Box
          p="4"
          border="1px solid"
          borderColor="gray.100"
          borderRadius="md"
          minH="320px"
        >
          <Heading fontSize="sm" mb="4">
            Білім базасы көлемі
          </Heading>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={knowledgeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2b6cb0" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Grid>

      <Box p="4" border="1px solid" borderColor="gray.100" borderRadius="md" mt="5">
        <Heading fontSize="sm" mb="4">
          KPI және мақсат
        </Heading>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={targetComparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="current" name="ағымдағы" fill="#2f855a" />
            <Bar dataKey="target" name="мақсат" fill="#718096" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default Analytics;

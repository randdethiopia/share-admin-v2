import AdminAuth from "./admin";
import AdminDashboardApi from "./admin-dashboard";
import AdminProfileApi from "./admin-profile";
import Access from "./access";
import AdvisorProfileApi from "./advisor-profile";
import BlogApi from "./blog";
import BusinessProfileApi from "./Buisness";
import IdeaBankApi from "./idea-bank";
import InvestmentApi from "./investment";
import InvitationApi from "./invitation";
import MentorProfileApi from "./mentor-profile";
import InvestorProfileApi from "./mentor"
import OpportunityApi from "./opportunity";
import ProjectApi from "./project";
import SkillsApi from "./skills";
import TraineeAuth from "./trainee";
import TrainingSessionApi from "./training-session";
import WaitListApi from "./waitlist";

export type { BlogType } from "./blog";
export type { ProfileType as AdvisorProfileType } from "./advisor-profile";
export type { BusinessProfileType, RejectBusinessInput } from "./Buisness";
export type { IdeaBankType } from "./idea-bank";
export type { InvestmentType } from "./investment";
export type { MentorProfileType } from "./mentor-profile";
export type { InvestorProfileType } from "./mentor";
export type { OpportunityType } from "./opportunity";
export type { ProjectGallery, ProjectStatus, ProjectType, ProjectUpdate } from "./project";
export type { SkillType } from "./skills";
export type { TraineeType, TraineeReport } from "./trainee";
export type { ApplicantCreateRequest } from "./waitlist";
export type { InvitationType } from "./invitation";
export type { AdminDashboardStats } from "./admin-dashboard";
export { getProjectByIdFn } from "./project";
export { getWaitListServerSideFn } from "./waitlist";
export { uploadFileFn } from "./upload";
export type { UploadImageRes } from "./upload";

const api = {
    AdminAuth,
    AdminDashboard: AdminDashboardApi,
    AdminProfile: AdminProfileApi,
    Access,
    AdvisorProfile: AdvisorProfileApi,
    Blog: BlogApi,
    BusinessProfile: BusinessProfileApi,
    IdeaBank: IdeaBankApi,
    Investment: InvestmentApi,
    Invitation: InvitationApi,
    MentorProfile: MentorProfileApi,
    InvestorProfile: InvestorProfileApi,
    Opportunity: OpportunityApi,
    Project: ProjectApi,
    Skills: SkillsApi,
    TraineeAuth,
    TrainingSession: TrainingSessionApi,
    WaitList: WaitListApi,
}

export default api;
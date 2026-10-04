package me.nghlong3004.olympic.daily.sharing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import java.time.Clock;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import me.nghlong3004.olympic.common.error.ApiException;
import me.nghlong3004.olympic.common.error.ErrorCode;
import me.nghlong3004.olympic.common.security.CurrentUser;
import me.nghlong3004.olympic.common.security.CurrentUserProvider;
import me.nghlong3004.olympic.daily.enums.DailyTaskPriority;
import me.nghlong3004.olympic.daily.enums.DailyTaskStatus;
import me.nghlong3004.olympic.daily.evidence.enums.EvidenceStage;
import me.nghlong3004.olympic.daily.evidence.service.EvidenceService;
import me.nghlong3004.olympic.daily.evidence.service.impl.EvidenceServiceImpl;
import me.nghlong3004.olympic.daily.feedback.request.SaveDailyFeedbackRequest;
import me.nghlong3004.olympic.daily.feedback.service.DailyFeedbackService;
import me.nghlong3004.olympic.daily.feedback.service.impl.DailyFeedbackServiceImpl;
import me.nghlong3004.olympic.daily.request.DailyTaskRequest;
import me.nghlong3004.olympic.daily.request.SaveDailyPlanRequest;
import me.nghlong3004.olympic.daily.request.SaveDailyWeekRequest;
import me.nghlong3004.olympic.daily.response.DailyPlanResponse;
import me.nghlong3004.olympic.daily.service.DailyService;
import me.nghlong3004.olympic.daily.service.impl.DailyServiceImpl;
import me.nghlong3004.olympic.daily.mapper.DailyMapperImpl;
import me.nghlong3004.olympic.daily.evidence.mapper.EvidenceMapperImpl;
import me.nghlong3004.olympic.daily.feedback.mapper.DailyFeedbackMapperImpl;
import me.nghlong3004.olympic.daily.sharing.mapper.SharedDailyMapperImpl;
import me.nghlong3004.olympic.group.mapper.GroupMapperImpl;
import me.nghlong3004.olympic.daily.sharing.enums.DailyShareAccess;
import me.nghlong3004.olympic.daily.sharing.service.SharedDailyService;
import me.nghlong3004.olympic.daily.sharing.service.impl.SharedDailyAccessImpl;
import me.nghlong3004.olympic.daily.sharing.service.impl.SharedDailyServiceImpl;
import me.nghlong3004.olympic.group.enums.SharingMode;
import me.nghlong3004.olympic.group.request.CreateGroupRequest;
import me.nghlong3004.olympic.group.request.CreateGroupInvitationRequest;
import me.nghlong3004.olympic.group.request.ReplaceGroupSharingRequest;
import me.nghlong3004.olympic.group.service.GroupService;
import me.nghlong3004.olympic.group.service.GroupAvatarService;
import me.nghlong3004.olympic.group.service.impl.GroupAvatarServiceImpl;
import me.nghlong3004.olympic.group.request.UpdateGroupAvatarCropRequest;
import me.nghlong3004.olympic.question.service.impl.QuestionFigurePolicy;
import me.nghlong3004.olympic.group.service.impl.GroupServiceImpl;
import me.nghlong3004.olympic.group.service.impl.GroupDailyAccessImpl;
import me.nghlong3004.olympic.group.service.impl.GroupMembershipServiceImpl;
import me.nghlong3004.olympic.user.enums.Role;
import me.nghlong3004.olympic.user.enums.Status;
import me.nghlong3004.olympic.user.exception.UserDisabledException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Real persisted consent -> historical review -> evidence and identified contributor revocation.
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 10/4/2026
 */
@DataJpaTest(properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers(disabledWithoutDocker = true)
@Import({GroupServiceImpl.class, GroupMembershipServiceImpl.class, GroupDailyAccessImpl.class,
  SharedDailyAccessImpl.class, SharedDailyServiceImpl.class, DailyFeedbackServiceImpl.class,
  DailyServiceImpl.class, EvidenceServiceImpl.class, DailyMapperImpl.class, EvidenceMapperImpl.class,
  DailyFeedbackMapperImpl.class, SharedDailyMapperImpl.class, GroupMapperImpl.class,
  GroupAvatarServiceImpl.class, QuestionFigurePolicy.class,
  DailyGroupMvpIntegrationTest.Dependencies.class})
class DailyGroupMvpIntegrationTest {
  @Container @ServiceConnection static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine");
  private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-00000000f101");
  private static final UUID VIEWER = UUID.fromString("00000000-0000-0000-0000-00000000f102");
  private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-00000000f103");
  private static final UUID ADMIN = UUID.fromString("00000000-0000-0000-0000-00000000f104");
  private static final LocalDate DATE = LocalDate.of(2026, 9, 7);
  @Autowired GroupService groups;
  @Autowired GroupAvatarService avatars;
  @Autowired SharedDailyService shared;
  @Autowired DailyFeedbackService feedback;
  @Autowired DailyService daily;
  @Autowired EvidenceService evidence;
  @Autowired Actors actors;
  @Autowired JdbcTemplate jdbc;
  UUID group;
  DailyPlanResponse plan;

  @BeforeEach void reset() {
    jdbc.execute("TRUNCATE daily_feedback,daily_evidence,daily_tasks,daily_plans,daily_weekly_reviews,accountability_group_invitations,accountability_group_share_viewers,accountability_group_memberships,accountability_groups CASCADE");
    jdbc.update("DELETE FROM users WHERE id IN (?,?,?,?)", OWNER, VIEWER, OTHER, ADMIN);
    for (var id : List.of(OWNER, VIEWER, OTHER, ADMIN)) jdbc.update(
      "INSERT INTO users(id,email,username,full_name,role,status) VALUES (?,?,?,?,?::user_role,'ACTIVE')",
      id, id + "@test.invalid", username(id), "Name " + username(id), id.equals(ADMIN) ? "ADMIN" : "STUDENT");
    as(OWNER);
    group = groups.create(new CreateGroupRequest(" Consent ")).id();
    plan = daily.savePlan(DATE, new SaveDailyPlanRequest(null, "Reason", "Well", "Tomorrow",
      List.of(new DailyTaskRequest(null, "Historic work", DailyTaskPriority.MUST, DailyTaskStatus.COMPLETED))));
  }

  @Test void explicitTargetConsentDefaultOffUniquePendingAndForgery() {
    var invite = groups.invite(group, new CreateGroupInvitationRequest(username(VIEWER)));
    expect(ErrorCode.DUPLICATE_RESOURCE, () -> groups.invite(group, new CreateGroupInvitationRequest(username(VIEWER))));
    as(OTHER);
    expect(ErrorCode.ACCESS_DENIED, () -> groups.accept(invite.id()));
    expect(ErrorCode.ACCESS_DENIED, () -> groups.decline(invite.id()));
    as(VIEWER);
    assertThat(groups.list()).isEmpty();
    assertThat(groups.invitations()).hasSize(1);
    expect(ErrorCode.RESOURCE_NOT_FOUND, () -> shared.dashboard(group, DATE));
    groups.accept(invite.id());
    groups.accept(invite.id());
    assertThat(groups.invitations()).isEmpty();
    var settings = groups.detail(group).mySharing();
    assertThat(settings.shareDaily()).isFalse();
    assertThat(settings.sharingMode()).isEqualTo(SharingMode.GROUP);
    assertThat(settings.selectedViewerIds()).isEmpty();
    assertThat(shared.dashboard(group, DATE).members().stream().filter(m -> OWNER.equals(m.userId())).findFirst().orElseThrow().summary()).isNull();
    expect(ErrorCode.ACCESS_DENIED, () -> shared.readPlan(group, OWNER, DATE));
  }

  @Test void groupAvatarOriginalBytesFramingOwnershipAndRevocation() throws Exception {
    var output = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(3, 2, BufferedImage.TYPE_INT_RGB), "png", output);
    var bytes = output.toByteArray();
    var file = new MockMultipartFile("image", "group.png", "image/png", bytes);
    var crop = new UpdateGroupAvatarCropRequest(.3, .6, 1.5);
    var saved = avatars.upload(group, file, crop);
    assertThat(groups.list().getFirst().avatar()).isEqualTo(saved);
    assertThat(groups.detail(group).avatar()).isEqualTo(saved);
    assertThat(avatars.read(group, saved.id()).content()).isEqualTo(bytes);
    assertThat(avatars.read(group, saved.id()).mediaType()).isEqualTo("image/png");
    assertThat(groups.detail(group).mySharing().shareDaily()).isFalse();
    var invite = groups.invite(group, new CreateGroupInvitationRequest(username(VIEWER)));
    as(VIEWER);
    expect(ErrorCode.ACCESS_DENIED, () -> avatars.read(group, saved.id()));
    groups.accept(invite.id());
    assertThat(avatars.read(group, saved.id()).content()).isEqualTo(bytes);
    expect(ErrorCode.ACCESS_DENIED, () -> avatars.upload(group, file, crop));
    expect(ErrorCode.ACCESS_DENIED, () -> avatars.crop(group, saved.id(), crop));
    expect(ErrorCode.ACCESS_DENIED, () -> avatars.remove(group, saved.id()));
    groups.leave(group);
    expect(ErrorCode.ACCESS_DENIED, () -> avatars.read(group, saved.id()));
    as(ADMIN);
    expect(ErrorCode.ACCESS_DENIED, () -> avatars.read(group, saved.id()));
    expect(ErrorCode.ACCESS_DENIED, () -> avatars.upload(group, file, crop));
    as(OWNER);
    var reframed = avatars.crop(group, saved.id(), new UpdateGroupAvatarCropRequest(.7, .4, 2.0));
    assertThat(reframed.id()).isEqualTo(saved.id());
    assertThat(reframed.crop().zoom()).isEqualTo(2);
    assertThat(avatars.read(group, saved.id()).content()).isEqualTo(bytes);
    expect(ErrorCode.VALIDATION_ERROR, () -> avatars.crop(group, saved.id(), new UpdateGroupAvatarCropRequest(Double.NaN, .5, 1.0)));
    expect(ErrorCode.FILE_TYPE_NOT_ALLOWED, () -> avatars.upload(group, new MockMultipartFile("image", "spoof.png", "image/png", "<svg/>".getBytes()), crop));
    var replacement = avatars.upload(group, file, crop);
    expect(ErrorCode.RESOURCE_NOT_FOUND, () -> avatars.read(group, saved.id()));
    expect(ErrorCode.RESOURCE_STATE_CONFLICT, () -> avatars.crop(group, saved.id(), crop));
    expect(ErrorCode.RESOURCE_STATE_CONFLICT, () -> avatars.remove(group, saved.id()));
    avatars.remove(group, replacement.id());
    assertThat(groups.detail(group).avatar()).isNull();
    expect(ErrorCode.RESOURCE_NOT_FOUND, () -> avatars.read(group, replacement.id()));
    groups.leave(group);
    expect(ErrorCode.ACCESS_DENIED, () -> avatars.upload(group, file, crop));
  }

  @Test void declineTerminalCannotAcceptAndDepartedFounderCannotGrant() {
    var declined = groups.invite(group, new CreateGroupInvitationRequest(username(VIEWER)));
    as(VIEWER); groups.decline(declined.id()); groups.decline(declined.id());
    expect(ErrorCode.RESOURCE_STATE_CONFLICT, () -> groups.accept(declined.id()));
    as(OWNER);
    var pending = groups.invite(group, new CreateGroupInvitationRequest(username(VIEWER)));
    groups.leave(group);
    as(VIEWER);
    assertThat(groups.invitations()).isEmpty();
    expect(ErrorCode.ACCESS_DENIED, () -> groups.accept(pending.id()));
    assertThat(groups.list()).isEmpty();
  }

  @Test void atomicAudienceValidationEvenOffRollsBackAndNonFounderCannotInvite() {
    join(VIEWER); join(OTHER);
    as(OWNER); sharing(true, SharingMode.SELECTED_MEMBERS, List.of(VIEWER));
    expect(ErrorCode.ACCESS_DENIED, () -> sharing(false, SharingMode.GROUP, List.of(ADMIN)));
    assertThat(groups.detail(group).mySharing().shareDaily()).isTrue();
    assertThat(groups.detail(group).mySharing().selectedViewerIds()).containsExactly(VIEWER);
    expect(ErrorCode.VALIDATION_ERROR, () -> sharing(false, SharingMode.GROUP, List.of(OWNER)));
    expect(ErrorCode.VALIDATION_ERROR, () -> sharing(false, SharingMode.GROUP, List.of(VIEWER, VIEWER)));
    as(VIEWER);
    expect(ErrorCode.ACCESS_DENIED, () -> groups.invite(group, new CreateGroupInvitationRequest(username(ADMIN))));
  }

  @Test void currentHistoricalDayWeekMatchesOwnerShapesAndNotSharedHasNoExistenceLeak() {
    join(VIEWER);
    as(OWNER);
    daily.savePlan(DATE.plusDays(1), new SaveDailyPlanRequest(null, null,null,null,List.of()));
    var ownerWeek = daily.saveWeek(DATE.plusDays(2), new SaveDailyWeekRequest(null,"Repeated","Issues","Reflection","Next"));
    var ownerPlan = daily.getPlan(DATE);
    sharing(true, SharingMode.GROUP, List.of());
    as(VIEWER);
    assertThat(shared.readPlan(group, OWNER, DATE)).isEqualTo(ownerPlan);
    assertThat(shared.readWeek(group, OWNER, DATE.plusDays(3))).isEqualTo(ownerWeek);
    assertThat(ownerWeek.plannedDays()).isEqualTo(2);
    assertThat(ownerWeek.nonemptyDays()).isEqualTo(1);
    assertThat(ownerWeek.mustRate()).isEqualByComparingTo("1");
    as(OWNER); sharing(false, SharingMode.GROUP, List.of());
    as(VIEWER);
    for (var date : List.of(DATE, DATE.minusDays(1))) {
      var row = shared.dashboard(group, date).members().stream().filter(m -> OWNER.equals(m.userId())).findFirst().orElseThrow();
      assertThat(row.access()).isEqualTo(DailyShareAccess.NOT_SHARED);
      assertThat(row.summary()).isNull();
    }
  }

  @Test void identifiedEditableFeedbackCurrentContributorsCountAndGroupIsolation() {
    join(VIEWER); join(OTHER);
    as(OWNER); sharing(true, SharingMode.GROUP, List.of());
    var before = daily.getPlan(DATE);
    as(VIEWER);
    var first = feedback.save(group, OWNER, "plans", plan.id(), new SaveDailyFeedbackRequest("  First\nNext  ", null));
    assertThat(first.authorId()).isEqualTo(VIEWER);
    assertThat(first.authorDisplayName()).isEqualTo("Name " + username(VIEWER));
    assertThat(first.text()).isEqualTo("First\nNext");
    expect(ErrorCode.RESOURCE_STATE_CONFLICT, () -> feedback.save(group, OWNER, "plans", plan.id(), new SaveDailyFeedbackRequest("Duplicate", null)));
    var second = feedback.save(group, OWNER, "plans", plan.id(), new SaveDailyFeedbackRequest("Edited", first.version()));
    expect(ErrorCode.RESOURCE_STATE_CONFLICT, () -> feedback.remove(group, OWNER, "plans", plan.id(), first.version()));
    as(OTHER); feedback.save(group, OWNER, "plans", plan.id(), new SaveDailyFeedbackRequest("Other notes", null));
    as(OWNER);
    assertThat(feedback.list(group, OWNER, "plans", plan.id()).contributorCount()).isEqualTo(2);
    assertThat(daily.getPlan(DATE)).isEqualTo(before);
    expect(ErrorCode.ACCESS_DENIED, () -> feedback.save(group, OWNER, "plans", plan.id(), new SaveDailyFeedbackRequest("Own", null)));
    sharing(true, SharingMode.SELECTED_MEMBERS, List.of(VIEWER));
    assertThat(feedback.list(group, OWNER, "plans", plan.id()).contributions()).extracting("authorId").containsExactly(VIEWER);
    sharing(false, SharingMode.GROUP, List.of());
    assertThat(feedback.list(group, OWNER, "plans", plan.id()).contributorCount()).isZero();
    as(VIEWER);
    expect(ErrorCode.ACCESS_DENIED, () -> feedback.list(group, OWNER, "plans", plan.id()));
    as(OWNER); sharing(true, SharingMode.GROUP, List.of());
    var another = groups.create(new CreateGroupRequest("Another")).id();
    var inv = groups.invite(another,new CreateGroupInvitationRequest(username(VIEWER)));
    as(VIEWER); groups.accept(inv.id());
    as(OWNER); groups.replaceSharing(another,new ReplaceGroupSharingRequest(true,SharingMode.GROUP,List.of()));
    as(VIEWER);
    assertThat(feedback.list(another, OWNER, "plans", plan.id()).contributorCount()).isZero();
    feedback.remove(group, OWNER, "plans", plan.id(), second.version());
    assertThat(feedback.list(group, OWNER, "plans", plan.id()).contributorCount()).isEqualTo(1);
  }

  @Test void weeklyFeedbackRequiresSavedActualOwnerReviewAndValidText() {
    join(VIEWER);
    as(OWNER); sharing(true, SharingMode.GROUP,List.of());
    var week = daily.saveWeek(DATE, new SaveDailyWeekRequest(null,null,null,"Week",null));
    as(VIEWER);
    expect(ErrorCode.RESOURCE_NOT_FOUND, () -> feedback.save(group,OWNER,"weeks",plan.id(),new SaveDailyFeedbackRequest("Wrong",null)));
    expect(ErrorCode.RESOURCE_NOT_FOUND, () -> feedback.list(group,VIEWER,"plans",plan.id()));
    expect(ErrorCode.VALIDATION_ERROR, () -> feedback.save(group,OWNER,"weeks",week.id(),new SaveDailyFeedbackRequest("  ",null)));
    feedback.save(group,OWNER,"weeks",week.id(),new SaveDailyFeedbackRequest("Weekly advice",null));
    assertThat(feedback.list(group,OWNER,"weeks",week.id()).contributorCount()).isEqualTo(1);
    assertThat(feedback.list(group,OWNER,"plans",plan.id()).contributorCount()).isZero();
  }

  @Test void joinedHistoricMetadataBytesAndReviewsRevokeOffDeselectAndEitherLeave() {
    join(VIEWER);
    as(OWNER);
    var file = evidence.createFile(plan.id(),plan.tasks().getFirst().id(),EvidenceStage.START,
      new MockMultipartFile("file","historic.svg","image/svg+xml",new byte[]{3,1,4}));
    daily.saveWeek(DATE,new SaveDailyWeekRequest(null,null,null,"History",null));
    sharing(true,SharingMode.GROUP,List.of());
    as(VIEWER); assertThat(evidence.download(plan.id(),file.taskId(),file.id(),group).content()).containsExactly((byte)3,(byte)1,(byte)4);
    as(OWNER); sharing(false,SharingMode.GROUP,List.of()); denyHistorical(file.taskId(),file.id());
    as(OWNER); sharing(true,SharingMode.SELECTED_MEMBERS,List.of(VIEWER));
    as(VIEWER); assertThat(shared.readPlan(group,OWNER,DATE).id()).isEqualTo(plan.id());
    as(OWNER); sharing(true,SharingMode.SELECTED_MEMBERS,List.of()); denyHistorical(file.taskId(),file.id());
    as(OWNER); sharing(true,SharingMode.SELECTED_MEMBERS,List.of(VIEWER));
    as(VIEWER); groups.leave(group); denyHistorical(file.taskId(),file.id());
    // New explicit invitation only; default-OFF membership cannot regain old audience.
    join(VIEWER);
    as(OWNER); assertThat(groups.detail(group).mySharing().selectedViewerIds()).isEmpty();
    sharing(true,SharingMode.GROUP,List.of());
    groups.leave(group); denyHistorical(file.taskId(),file.id());
  }

  @Test void acceptedInviteReplayCannotRejoinOrResurrectSelections() {
    as(OWNER); var inv = groups.invite(group,new CreateGroupInvitationRequest(username(VIEWER)));
    as(VIEWER); groups.accept(inv.id());
    sharing(true,SharingMode.GROUP,List.of()); groups.leave(group);
    expect(ErrorCode.ACCESS_DENIED, () -> groups.accept(inv.id()));
    assertThat(groups.list()).isEmpty();
    join(VIEWER);
    assertThat(groups.detail(group).mySharing().shareDaily()).isFalse();
  }

  @Test void disabledDeletedAndAdminCannotBypassCurrentRecipientGate() {
    join(VIEWER); join(ADMIN);
    as(ADMIN);
    expect(ErrorCode.ACCESS_DENIED, () -> shared.readPlan(group,OWNER,DATE));
    as(OWNER); sharing(true,SharingMode.GROUP,List.of());
    jdbc.update("UPDATE users SET status='DISABLED' WHERE id=?",OWNER);
    as(VIEWER); expect(ErrorCode.ACCESS_DENIED, () -> shared.readPlan(group,OWNER,DATE));
    jdbc.update("UPDATE users SET status='ACTIVE',deleted_at=now() WHERE id=?",OWNER);
    expect(ErrorCode.ACCESS_DENIED, () -> shared.readWeek(group,OWNER,DATE));
    jdbc.update("UPDATE users SET deleted_at=NULL WHERE id=?",OWNER);
    jdbc.update("UPDATE users SET status='DISABLED' WHERE id=?",VIEWER);
    assertThatThrownBy(() -> groups.list()).isInstanceOf(UserDisabledException.class);
  }

  @Test void concurrentFeedbackCreateHasOneWinnerAndOneConflict() throws Exception {
    join(VIEWER);
    as(OWNER); sharing(true,SharingMode.GROUP,List.of());
    var ready = new CountDownLatch(2);
    var start = new CountDownLatch(1);
    var errors = new CopyOnWriteArrayList<Throwable>();
    try (var pool = Executors.newFixedThreadPool(2)) {
      for(int i=0;i<2;i++) pool.submit(() -> {
        as(VIEWER); ready.countDown();
        try { start.await(); feedback.save(group,OWNER,"plans",plan.id(),new SaveDailyFeedbackRequest("Concurrent",null)); }
        catch(Throwable e){errors.add(e);}
      });
      assertThat(ready.await(10,TimeUnit.SECONDS)).isTrue(); start.countDown(); pool.shutdown();
      assertThat(pool.awaitTermination(30,TimeUnit.SECONDS)).isTrue();
    }
    assertThat(errors).hasSize(1);
    assertThat(errors.getFirst()).isInstanceOf(ApiException.class);
    assertThat(((ApiException)errors.getFirst()).getErrorCode()).isEqualTo(ErrorCode.RESOURCE_STATE_CONFLICT);
    as(VIEWER); assertThat(feedback.list(group,OWNER,"plans",plan.id()).contributorCount()).isEqualTo(1);
  }

  private void denyHistorical(UUID task,UUID item) {
    as(VIEWER);
    assertThatThrownBy(() -> shared.readPlan(group,OWNER,DATE)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> shared.readWeek(group,OWNER,DATE)).isInstanceOf(ApiException.class);
    expect(ErrorCode.ACCESS_DENIED, () -> evidence.list(plan.id(),task,group));
    expect(ErrorCode.ACCESS_DENIED, () -> evidence.download(plan.id(),task,item,group));
  }

  @Test void departedOrDisabledContributorDisappearsWithoutDeletingTheirPersistedText() {
    join(VIEWER);
    as(OWNER); sharing(true,SharingMode.GROUP,List.of());
    as(VIEWER);
    feedback.save(group,OWNER,"plans",plan.id(),new SaveDailyFeedbackRequest("Preserved advice",null));
    as(OWNER); assertThat(feedback.list(group,OWNER,"plans",plan.id()).contributorCount()).isEqualTo(1);
    jdbc.update("UPDATE users SET status='DISABLED' WHERE id=?",VIEWER);
    assertThat(feedback.list(group,OWNER,"plans",plan.id()).contributorCount()).isZero();
    jdbc.update("UPDATE users SET status='ACTIVE' WHERE id=?",VIEWER);
    as(VIEWER); groups.leave(group);
    as(OWNER); assertThat(feedback.list(group,OWNER,"plans",plan.id()).contributorCount()).isZero();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM daily_feedback WHERE group_id=? AND author_id=?",Long.class,group,VIEWER)).isEqualTo(1);
  }

  @Test void concurrentInvitationCreatesAreUniqueAndAcceptReplayStaysSingleMembership() throws Exception {
    var start=new CountDownLatch(1);
    var errors=new CopyOnWriteArrayList<Throwable>();
    try(var pool=Executors.newFixedThreadPool(2)) {
      for(int i=0;i<2;i++)pool.submit(()->{as(OWNER);try{start.await();groups.invite(group,new CreateGroupInvitationRequest(username(VIEWER)));}catch(Throwable e){errors.add(e);}});
      start.countDown();pool.shutdown();assertThat(pool.awaitTermination(30,TimeUnit.SECONDS)).isTrue();
    }
    assertThat(errors).hasSize(1);
    assertThat(((ApiException)errors.getFirst()).getErrorCode()).isEqualTo(ErrorCode.DUPLICATE_RESOURCE);
    as(VIEWER);var invitation=groups.invitations().getFirst();
    errors.clear();
    try(var pool=Executors.newFixedThreadPool(2)) {
      for(int i=0;i<2;i++)pool.submit(()->{as(VIEWER);try{groups.accept(invitation.id());}catch(Throwable e){errors.add(e);}});
      pool.shutdown();assertThat(pool.awaitTermination(30,TimeUnit.SECONDS)).isTrue();
    }
    assertThat(errors).isEmpty();
    assertThat(jdbc.queryForObject("SELECT count(*) FROM accountability_group_memberships WHERE group_id=? AND user_id=?",Long.class,group,VIEWER)).isEqualTo(1);
    assertThat(groups.detail(group).mySharing().shareDaily()).isFalse();
  }

  private void sharing(boolean on,SharingMode mode,List<UUID> selected) {
    groups.replaceSharing(group,new ReplaceGroupSharingRequest(on,mode,selected));
  }
  private void join(UUID target) {
    as(OWNER); var inv=groups.invite(group,new CreateGroupInvitationRequest(username(target)));
    as(target); groups.accept(inv.id());
  }
  private void as(UUID id){actors.id.set(id);}
  private static String username(UUID id){return "mvp-" + id.toString().substring(32);}
  private static void expect(ErrorCode code,Runnable action) {
    assertThatThrownBy(action::run).isInstanceOf(ApiException.class).extracting("errorCode").isEqualTo(code);
  }
  @TestConfiguration static class Dependencies {
    @Bean Clock clock(){return Clock.systemUTC();}
    @Bean Actors actors(){return new Actors();}
  }
  static class Actors implements CurrentUserProvider {
    final ThreadLocal<UUID> id=ThreadLocal.withInitial(() -> OWNER);
    @Override public CurrentUser getCurrentUser(){
      return new CurrentUser(id.get(),"fixture@test.invalid",username(id.get()),"Fixture",
        id.get().equals(ADMIN)?Role.ADMIN:Role.STUDENT,Status.ACTIVE,List.of());
    }
  }
}

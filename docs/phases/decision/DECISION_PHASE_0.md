# Olympic Learning Platform — Phase 0 Project Initiation

## 1. Document Information

| Field        | Value                                                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project name | Olympic Learning Platform                                                                                                                                              |
| Phase        | Phase 0 — Project Initiation / Discovery                                                                                                                               |
| Status       | Draft for baseline                                                                                                                                                     |
| Purpose      | Chốt mục đích sản phẩm, vấn đề cần giải quyết, nhóm người dùng, phạm vi ban đầu, ràng buộc, rủi ro và tiêu chí thành công trước khi bước sang Requirements Engineering |

---

## 2. Product Purpose

Olympic Learning Platform là hệ thống hỗ trợ sinh viên ôn luyện các môn Olympic thuộc Khoa Khoa học Cơ bản, đồng thời hỗ trợ giảng viên, admin và ban tổ chức quản lý nội dung học tập, tổ chức các bài luyện tập, bài kiểm tra/sàng lọc và theo dõi kết quả học tập.

Hệ thống phục vụ cả hai mục đích chính:

1. **Ôn luyện cá nhân**: sinh viên có thể học tập, luyện bài, làm đề, xem kết quả, theo dõi tiến độ và biết năng lực của mình so với các bạn.
2. **Sàng lọc Olympic nội bộ**: ban tổ chức có thể tổ chức nhiều đợt luyện tập, bài tập hoặc vòng kiểm tra để tham khảo năng lực sinh viên trước khi đưa ra quyết định cuối cùng.

Kết quả trên hệ thống chỉ mang tính chất tham khảo và hỗ trợ. Quyết định cuối cùng trong hoạt động Olympic vẫn thuộc về ban tổ chức.

---

## 3. Background

Hiện tại quá trình ôn luyện Olympic có thể gặp nhiều khó khăn do tài liệu, đề thi, câu hỏi, lời giải và thông báo bị phân tán ở nhiều nguồn như Excel, PDF, Word, ảnh, đề cũ, nhóm chat hoặc tài liệu do giảng viên gửi riêng lẻ.

Sinh viên khó biết mình nên ôn từ đâu, yếu chuyên đề nào và tiến bộ ra sao. Giảng viên hoặc ban tổ chức cũng khó quản lý ngân hàng câu hỏi, giao bài tập, tổ chức nhiều đợt luyện tập và theo dõi năng lực của nhiều sinh viên cùng lúc.

Olympic Learning Platform được xây dựng để tập trung hóa quá trình ôn luyện, quản lý câu hỏi, tổ chức luyện tập/sàng lọc và hỗ trợ đánh giá năng lực sinh viên.

---

## 4. Problem Statement

Sinh viên cần một môi trường ôn luyện tập trung, có lộ trình, có bài luyện tập, có phản hồi sau khi làm bài và có khả năng theo dõi tiến độ. Tuy nhiên, hiện tại tài liệu và đề luyện thường bị rải rác, thiếu hệ thống và thiếu feedback kịp thời.

Giảng viên, admin và ban tổ chức cần một nơi quản lý ngân hàng câu hỏi, đề thi, tài liệu, bài tập và kết quả làm bài. Tuy nhiên, việc quản lý bằng file rời hoặc nhóm chat khiến quá trình tổ chức luyện tập, giao bài, chấm bài và sàng lọc sinh viên trở nên khó theo dõi và khó mở rộng.

---

## 5. Main Pain Points

### 5.1. Student Pain Points

Sinh viên đang gặp các vấn đề chính:

* Tài liệu ôn luyện bị rải rác ở nhiều nguồn như Excel, PDF, Word, ảnh, đề cũ hoặc nhóm chat.
* Không biết nên bắt đầu ôn từ đâu.
* Không biết mình yếu chuyên đề nào.
* Làm bài xong không có feedback nhanh.
* Không có lịch sử theo dõi tiến bộ.
* Thiếu môi trường luyện tập giống với các đợt thi hoặc sàng lọc thật.
* Thiếu tính cạnh tranh và động lực học tập.
* Không được hỗ trợ kịp thời khi gặp khó khăn trong quá trình ôn luyện.

### 5.2. Teacher / Admin / Organizer Pain Points

Giảng viên, admin và ban tổ chức đang gặp các vấn đề chính:

* Câu hỏi, đề thi, lời giải và tài liệu nằm rải rác ở nhiều file hoặc nhiều nguồn.
* Khó quản lý ngân hàng câu hỏi tập trung.
* Khó chuẩn hóa câu hỏi, đáp án, lời giải và độ khó.
* Khó tái sử dụng câu hỏi cho nhiều đợt luyện tập hoặc sàng lọc.
* Khó quản lý việc sinh viên đóng góp câu hỏi.
* Khó phê duyệt, chỉnh sửa và chuẩn hóa nội dung do người khác đóng góp.
* Khó xem dữ liệu kết quả để hỗ trợ quá trình sàng lọc.
* Khó nắm bắt năng lực của nhiều sinh viên cùng lúc.
* Giao bài tập xong dễ bị quên hoặc khó theo dõi tiến độ.
* Phải gửi lại lời giải hoặc tài liệu nhiều lần cho nhiều sinh viên.
* Khó tổ chức nhiều đợt kiểm tra/luyện tập do hạn chế thời gian và công cụ.

---

## 6. Target Users

### 6.1. Student

Sinh viên sử dụng hệ thống để:

* Ôn luyện theo môn học và chuyên đề.
* Làm bài luyện tập hoặc bài sàng lọc.
* Xem kết quả làm bài.
* Xem lịch sử học tập.
* Theo dõi tiến độ cá nhân.
* So sánh năng lực với các bạn thông qua bảng xếp hạng hoặc dữ liệu thống kê phù hợp.

### 6.2. Contributor

Contributor là sinh viên được cấp thêm quyền đóng góp nội dung.

Contributor có thể:

* Đề xuất câu hỏi.
* Đề xuất lời giải.
* Đề xuất tài liệu học tập.
* Gửi nội dung vào luồng phê duyệt.

Contributor không phải là role tách biệt bắt buộc ở mức tài khoản. Contributor được hiểu là Student có thêm permission, ví dụ `QUESTION_CONTRIBUTE`.

### 6.3. Teacher

Giảng viên sử dụng hệ thống để:

* Tạo và quản lý nội dung học thuật.
* Tạo câu hỏi, lời giải, tài liệu.
* Review hoặc phê duyệt nội dung do contributor gửi lên.
* Giao bài luyện tập hoặc bài kiểm tra.
* Chấm bài tự luận.
* Theo dõi năng lực sinh viên.

### 6.4. Admin

Admin sử dụng hệ thống để:

* Quản lý người dùng.
* Quản lý quyền và permission.
* Quản lý môn học, chuyên đề, câu hỏi, đề thi.
* Cấp hoặc thu hồi quyền đóng góp nội dung.
* Quản lý cấu hình hệ thống.
* Đảm bảo dữ liệu được tổ chức và phân quyền rõ ràng.

### 6.5. Organizer / BTC

Ban tổ chức sử dụng hệ thống để:

* Tổ chức các đợt luyện tập hoặc sàng lọc.
* Xem kết quả làm bài.
* Tham khảo bảng xếp hạng hoặc thống kê năng lực.
* Hỗ trợ quá trình lựa chọn sinh viên phù hợp cho hoạt động Olympic.

Kết quả trên hệ thống chỉ là dữ liệu tham khảo. Quyết định cuối cùng vẫn thuộc về ban tổ chức.

---

## 7. Usage Context

Hệ thống có hai bối cảnh sử dụng chính.

### 7.1. Practice Mode

Practice Mode là bối cảnh sinh viên sử dụng hệ thống để ôn luyện cá nhân.

Các hoạt động chính:

* Xem môn học.
* Xem chuyên đề.
* Làm bài luyện tập.
* Làm đề.
* Xem kết quả.
* Theo dõi lịch sử làm bài.
* Xem tiến độ học tập.
* Cải thiện điểm yếu theo chuyên đề.

### 7.2. Screening Mode

Screening Mode là bối cảnh ban tổ chức, admin hoặc giảng viên tạo các bài kiểm tra/luyện tập để hỗ trợ sàng lọc sinh viên.

Các hoạt động chính:

* Tạo đợt sàng lọc.
* Giao bài cho sinh viên.
* Sinh viên làm bài.
* Hệ thống ghi nhận kết quả.
* Phần trắc nghiệm được chấm tự động.
* Phần tự luận được lưu lại để người có quyền chấm thủ công.
* BTC xem kết quả, thống kê và bảng xếp hạng để tham khảo.

Screening Mode có thể có ranking hoặc sàng lọc tự động ở mức gợi ý/tham khảo, nhưng không thay thế quyết định cuối cùng của BTC.

### 7.3. Priority

Luyện tập là giá trị cốt lõi của sản phẩm. Screening Mode là use case quan trọng để hỗ trợ hoạt động Olympic nội bộ, nhưng không biến hệ thống thành công cụ quyết định cuối cùng.

---

## 8. Product Goals

| ID   | Goal                                                                          |
| ---- | ----------------------------------------------------------------------------- |
| G-01 | Giúp sinh viên ôn luyện theo môn học và chuyên đề.                            |
| G-02 | Hỗ trợ cả luyện tập cá nhân và sàng lọc Olympic nội bộ.                       |
| G-03 | Tập trung hóa ngân hàng câu hỏi, đề thi, lời giải và tài liệu từ nhiều nguồn. |
| G-04 | Cho phép giảng viên, admin và sinh viên được cấp quyền đóng góp nội dung.     |
| G-05 | Hỗ trợ cả câu hỏi trắc nghiệm và câu hỏi tự luận.                             |
| G-06 | Lưu lịch sử làm bài và kết quả học tập.                                       |
| G-07 | Cung cấp dữ liệu tham khảo cho BTC khi sàng lọc sinh viên.                    |
| G-08 | Tạo tính cạnh tranh và động lực học tập thông qua bảng xếp hạng phù hợp.      |
| G-09 | Hỗ trợ xây dựng lộ trình ôn luyện theo môn/chuyên đề trong các phase sau.     |
| G-10 | Giúp giảng viên/admin giao bài, theo dõi bài làm và quản lý kết quả dễ hơn.   |

---

## 9. Initial Scope

### 9.1. In Scope for MVP

MVP bao gồm các nhóm chức năng sau:

#### Authentication & Authorization

* Đăng ký.
* Đăng nhập.
* Quản lý user cơ bản.
* Quản lý role/permission cơ bản.

#### Contribution Workflow

* Sinh viên xin quyền đóng góp câu hỏi.
* Admin hoặc teacher duyệt quyền đóng góp.
* Người có quyền được gửi câu hỏi/lời giải/tài liệu vào hệ thống.
* Nội dung đóng góp cần đi qua luồng phê duyệt trước khi được sử dụng chính thức.

#### Content Management

* Quản lý môn học.
* Quản lý chuyên đề.
* Quản lý ngân hàng câu hỏi.
* Hỗ trợ câu hỏi trắc nghiệm.
* Hỗ trợ câu hỏi tự luận.
* Hỗ trợ lời giải, đáp án mẫu, rubric hoặc hướng dẫn chấm ở mức cơ bản.

#### Practice & Screening

* Tạo bài luyện tập.
* Tạo bài hoặc đợt sàng lọc.
* Sinh viên làm bài.
* Sinh viên nộp bài.
* Tự động chấm phần trắc nghiệm.
* Lưu bài tự luận để chấm.
* Teacher/admin chấm tự luận thủ công.
* Sinh viên xem kết quả.
* Sinh viên xem lịch sử làm bài.
* BTC xem kết quả sàng lọc.

#### Progress & Ranking

* Thống kê tiến độ cá nhân ở mức cơ bản.
* Bảng xếp hạng ở mức nội bộ/tham khảo.

#### Data Input

* Nhập tay.
* Tự tạo mới trong hệ thống.
* Import Excel cơ bản.
* Upload hoặc import cơ bản từ PDF/Word.
* Hỗ trợ đính kèm ảnh PNG/JPG trong câu hỏi, lời giải hoặc tài liệu.

### 9.2. Out of Scope for MVP

Các phần chưa làm trong MVP:

* AI tự sinh câu hỏi.
* AI tự chấm tự luận hoàn toàn.
* OCR ảnh PNG/JPG.
* Parse PDF/Word phức tạp, đặc biệt với công thức, bảng biểu, hình ảnh hoặc layout khó.
* Chống gian lận nâng cao.
* Thi real-time quy mô lớn.
* Leaderboard công khai quy mô lớn.
* Mobile app native.
* Thanh toán.
* Chatbot học tập.
* Chấm tự luận tự động bằng AI ở mức quyết định điểm cuối cùng.

---

## 10. MVP Priority

| Feature                              | Priority | Note                                       |
| ------------------------------------ | -------- | ------------------------------------------ |
| Đăng ký / đăng nhập                  | Must     | Bắt buộc để cá nhân hóa dữ liệu            |
| Quản lý user cơ bản                  | Must     | Cần cho vận hành thật                      |
| Quản lý role/permission cơ bản       | Must     | Cần phân quyền rõ                          |
| Quản lý môn học                      | Must     | Nền tảng nội dung                          |
| Quản lý chuyên đề                    | Must     | Nền tảng nội dung                          |
| Quản lý ngân hàng câu hỏi            | Must     | Core của hệ thống                          |
| Hỗ trợ câu hỏi trắc nghiệm           | Must     | Cần để tự chấm                             |
| Hỗ trợ câu hỏi tự luận               | Must     | Yêu cầu bắt buộc của sản phẩm              |
| Tạo bài luyện tập                    | Must     | Core flow của sinh viên                    |
| Sinh viên làm bài                    | Must     | Core flow                                  |
| Sinh viên nộp bài                    | Must     | Core flow                                  |
| Tự chấm phần trắc nghiệm             | Must     | Feedback nhanh                             |
| Lưu bài tự luận để chấm              | Must     | Hỗ trợ tự luận                             |
| Teacher/admin chấm tự luận thủ công  | Must     | Tự luận Level 2                            |
| Xem kết quả                          | Must     | Core feedback                              |
| Xem lịch sử làm bài                  | Must     | Theo dõi tiến bộ                           |
| Tạo bài/đợt sàng lọc                 | Should   | Quan trọng nhưng có thể đơn giản hóa ở MVP |
| BTC xem kết quả sàng lọc             | Should   | Hỗ trợ screening                           |
| Sinh viên xin quyền đóng góp câu hỏi | Should   | Có thể triển khai sau core flow            |
| Admin/teacher duyệt quyền đóng góp   | Should   | Đi cùng contribution workflow              |
| Import Excel                         | Should   | Quan trọng cho dữ liệu ban đầu             |
| Import PDF/Word cơ bản               | Should   | Chỉ hỗ trợ cơ bản/upload/nhập lại          |
| Thống kê tiến độ cá nhân             | Should   | Nên có ở mức cơ bản                        |
| Bảng xếp hạng nội bộ/tham khảo       | Could    | Tạo động lực nhưng không phải core scoring |
| OCR ảnh PNG/JPG                      | Won't    | Phase sau                                  |
| AI tự chấm tự luận                   | Won't    | Phase sau                                  |
| AI sinh câu hỏi                      | Won't    | Phase sau                                  |

---

## 11. Essay Question Support

MVP hỗ trợ tự luận ở Level 2.

### Level 1 — Required

* Tạo câu hỏi tự luận.
* Sinh viên nhập câu trả lời tự luận.
* Hệ thống lưu bài làm tự luận.

### Level 2 — Required for MVP

* Teacher/admin xem bài tự luận.
* Teacher/admin nhập điểm thủ công.
* Teacher/admin nhập nhận xét.
* Hệ thống lưu điểm và nhận xét.
* Kết quả cuối cùng của bài làm có thể bao gồm cả điểm trắc nghiệm tự động và điểm tự luận thủ công.

### Level 3 — Not in MVP

* AI tự chấm tự luận.
* Rule tự động chấm tự luận phức tạp.
* AI đưa ra điểm cuối cùng thay giảng viên/admin.

AI có thể được nghiên cứu ở phase sau, nhưng không phải phạm vi MVP.

---

## 12. Data Input Strategy

### 12.1. Long-term Data Sources

Về lâu dài, hệ thống có thể nhận dữ liệu từ:

* Nhập tay.
* Tạo mới trực tiếp trong hệ thống.
* Excel.
* PDF.
* Word.
* Ảnh PNG/JPG.
* Các nguồn dữ liệu khác nếu cần.

### 12.2. MVP Data Input

Trong MVP, hệ thống cần hỗ trợ:

* Nhập tay.
* Tạo mới trực tiếp trong hệ thống.
* Import Excel cơ bản.
* Upload hoặc import PDF/Word ở mức cơ bản.
* Đính kèm ảnh PNG/JPG trong câu hỏi, lời giải hoặc tài liệu.

### 12.3. Not Included in MVP

MVP chưa hỗ trợ:

* OCR ảnh PNG/JPG để tự bóc nội dung câu hỏi.
* Parse PDF/Word phức tạp.
* Tự động nhận diện công thức, bảng biểu, hình ảnh từ file phức tạp.
* Tự động chuyển đổi mọi file thành câu hỏi chuẩn.

---

## 13. Success Metrics

### 13.1. Functional Success Metrics

| ID    | Metric                                                                         |
| ----- | ------------------------------------------------------------------------------ |
| SM-01 | Sinh viên có thể hoàn thành một bài luyện tập hoặc bài sàng lọc trên hệ thống. |
| SM-02 | Hệ thống tự chấm được phần trắc nghiệm.                                        |
| SM-03 | Hệ thống lưu được phần tự luận để teacher/admin chấm.                          |
| SM-04 | Teacher/admin có thể chấm tự luận thủ công, nhập điểm và nhận xét.             |
| SM-05 | Người có quyền có thể tạo câu hỏi và gửi qua luồng phê duyệt.                  |
| SM-06 | Admin/teacher có thể tạo bài luyện tập hoặc bài sàng lọc.                      |
| SM-07 | BTC có thể xem kết quả làm bài để tham khảo.                                   |
| SM-08 | Sinh viên xem được lịch sử làm bài và kết quả của mình.                        |
| SM-09 | Câu hỏi được quản lý tập trung thay vì nằm rải rác ở nhiều file.               |

### 13.2. Quantitative Success Metrics

| Metric                            | Target                                                    |
| --------------------------------- | --------------------------------------------------------- |
| Số môn học tối thiểu              | 4                                                         |
| Số câu hỏi tối thiểu              | 40                                                        |
| Số sinh viên thử nghiệm tối thiểu | 20                                                        |
| Định dạng dữ liệu MVP             | Nhập tay, Excel, PDF/Word cơ bản, text, ảnh đính kèm      |
| Kết quả trắc nghiệm               | Trả ngay sau khi nộp bài                                  |
| Kết quả tự luận                   | Có thể chấm thủ công; SLA đề xuất tối đa 4 ngày           |
| Bài làm mẫu                       | Ít nhất 1 bài luyện tập hoặc bài sàng lọc chạy end-to-end |

---

## 14. Assumptions

| ID   | Assumption                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------- |
| A-01 | Khoa có nhu cầu dùng thật, không chỉ demo kỹ thuật.                                                 |
| A-02 | Luyện tập là giá trị cốt lõi của hệ thống.                                                          |
| A-03 | Sàng lọc là use case quan trọng để hỗ trợ BTC.                                                      |
| A-04 | Kết quả hệ thống không thay thế quyết định cuối cùng của BTC.                                       |
| A-05 | Dữ liệu ban đầu có thể chưa chuẩn và đến từ nhiều nguồn.                                            |
| A-06 | Sinh viên có thể đóng góp nội dung nếu được cấp quyền.                                              |
| A-07 | MVP cần hỗ trợ tự luận ở mức tạo câu, làm bài, lưu bài và chấm thủ công.                            |
| A-08 | Backend dùng Spring Boot.                                                                           |
| A-09 | Hệ thống expose REST API cho frontend.                                                              |
| A-10 | Hệ thống cần thiết kế mở rộng để sau này có thể thêm AI, import nâng cao, OCR và thống kê nâng cao. |

---

## 15. Constraints

| ID   | Constraint                                                                                |
| ---- | ----------------------------------------------------------------------------------------- |
| C-01 | Hệ thống hướng tới dùng thật trong khoa nên cần thiết kế cẩn thận.                        |
| C-02 | MVP có tự luận nên grading phức tạp hơn hệ thống quiz chỉ có trắc nghiệm.                 |
| C-03 | Dữ liệu đầu vào đa dạng nên cần chiến lược import rõ ràng.                                |
| C-04 | Cần approval workflow cho nội dung do sinh viên hoặc contributor đóng góp.                |
| C-05 | Cần phân biệt rõ luyện tập cá nhân và sàng lọc nội bộ.                                    |
| C-06 | Cần phân quyền rõ giữa student, contributor, teacher, admin và BTC.                       |
| C-07 | Cần thiết kế mở rộng để thêm AI, import nâng cao, OCR và analytics ở các phase sau.       |
| C-08 | Kết quả sàng lọc chỉ là tham khảo, không được thiết kế như quyết định cuối cùng thay BTC. |

---

## 16. Key Risks

| ID   | Risk                                                                             | Impact      | Mitigation                                                                       |
| ---- | -------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| R-01 | MVP quá rộng vì vừa luyện tập, vừa sàng lọc, vừa tự luận, vừa import nhiều nguồn | High        | Chia MVP theo core flow trước: tạo nội dung, làm bài, nộp bài, chấm, xem kết quả |
| R-02 | Tự luận khó chấm tự động                                                         | High        | MVP chỉ hỗ trợ chấm thủ công; AI chấm tự luận để phase sau                       |
| R-03 | PDF/Word/ảnh khó parse chuẩn                                                     | High        | MVP chỉ hỗ trợ upload/import cơ bản; OCR và parse phức tạp để phase sau          |
| R-04 | Sinh viên đóng góp nội dung có thể làm dữ liệu loạn nếu thiếu phê duyệt          | Medium-High | Bắt buộc approval workflow trước khi publish nội dung                            |
| R-05 | Dùng thật trong khoa nên cần bảo mật, phân quyền và backup tốt                   | Medium-High | Thiết kế auth, permission, audit log và backup ở các phase sau                   |
| R-06 | Kết quả sàng lọc có thể bị hiểu nhầm là quyết định cuối cùng                     | Medium      | UI và tài liệu phải ghi rõ kết quả chỉ mang tính tham khảo                       |
| R-07 | Auth/role/permission có thể phức tạp ngay từ đầu                                 | Medium      | Dùng role cơ bản kết hợp permission; contributor là student có thêm quyền        |
| R-08 | Leaderboard có thể tạo áp lực hoặc hiểu nhầm nếu công khai quá rộng              | Medium      | MVP chỉ dùng leaderboard nội bộ/tham khảo, có thể giới hạn theo lớp/đợt/môn      |

---

## 17. Decision Log

| ID   | Decision                                                                             |
| ---- | ------------------------------------------------------------------------------------ |
| D-01 | App phục vụ cả ôn luyện cá nhân và sàng lọc Olympic nội bộ.                          |
| D-02 | Luyện tập là giá trị cốt lõi của sản phẩm.                                           |
| D-03 | Sàng lọc là use case quan trọng nhưng chỉ hỗ trợ BTC tham khảo.                      |
| D-04 | Kết quả trên hệ thống không thay thế quyết định cuối cùng của BTC.                   |
| D-05 | Người tạo nội dung gồm giảng viên, admin và sinh viên được cấp quyền.                |
| D-06 | Contributor được hiểu là Student có thêm permission, không nhất thiết là role riêng. |
| D-07 | Cần có cơ chế xin quyền và phê duyệt quyền đóng góp.                                 |
| D-08 | Dữ liệu đầu vào có thể đến từ Excel, PDF, Word, ảnh, nhập tay hoặc tự tạo mới.       |
| D-09 | MVP bắt buộc hỗ trợ tự luận ở Level 2: tạo câu, làm bài, lưu bài và chấm thủ công.   |
| D-10 | MVP chưa hỗ trợ AI tự chấm tự luận.                                                  |
| D-11 | MVP chưa hỗ trợ AI tự sinh câu hỏi.                                                  |
| D-12 | MVP chưa hỗ trợ OCR ảnh PNG/JPG.                                                     |
| D-13 | PDF/Word trong MVP chỉ ở mức upload/import cơ bản, chưa parse phức tạp.              |
| D-14 | Project hướng tới dùng thật trong khoa, không chỉ demo kỹ thuật.                     |
| D-15 | Backend dự kiến dùng Spring Boot và expose REST API cho frontend.                    |

---

## 18. Phase 0 Exit Criteria

Phase 0 được xem là hoàn thành khi các điều kiện sau được thỏa mãn:

* Mục đích sản phẩm đã rõ.
* Nhóm người dùng chính đã rõ.
* Pain point chính đã rõ.
* Bối cảnh sử dụng chính đã rõ.
* MVP scope đã được giới hạn.
* Out of scope đã được ghi nhận.
* Success metrics đã có cả định tính và định lượng.
* Assumptions, constraints và risks đã được ghi nhận.
* Các quyết định nền tảng đã được lưu vào Decision Log.

Với các nội dung trên, Phase 0 có thể được chốt và chuyển sang Phase 1 — Requirements Engineering.

---

## 19. Next Phase

Sau khi chốt Phase 0, phase tiếp theo là:

# Phase 1 — Requirements Engineering

Các artifact cần tạo ở Phase 1:

* Stakeholder Needs.
* Business Requirements.
* User Requirements.
* Functional Requirements.
* Non-functional Requirements.
* Use Case Specification.
* Acceptance Criteria.
* Requirements Traceability Matrix.

Phase 1 sẽ chuyển các mục tiêu và phạm vi ở Phase 0 thành requirement có ID, priority và acceptance criteria rõ ràng.

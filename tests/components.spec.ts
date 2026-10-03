import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ChoiceButton from '@/components/ChoiceButton.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'
import NameForm from '@/components/NameForm.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import { i18n } from '@/i18n'

const global = { plugins: [i18n] }

describe('CountdownTimer', () => {
  it('kalan saniyeyi gösterir ve son 2 saniyede uyarı rengine geçer', async () => {
    const wrapper = mount(CountdownTimer, { props: { seconds: 5, progress: 1 }, global })
    expect(wrapper.get('[data-testid=countdown-seconds]').text()).toBe('5')
    expect(wrapper.get('[data-testid=countdown-ring]').classes()).toContain('stroke-indigo-500')

    await wrapper.setProps({ seconds: 2, progress: 0.4 })
    expect(wrapper.get('[data-testid=countdown-ring]').classes()).toContain('stroke-red-500')
  })

  it('progress halka doluluğunu belirler', () => {
    const full = mount(CountdownTimer, { props: { seconds: 5, progress: 1 }, global })
    const empty = mount(CountdownTimer, { props: { seconds: 0, progress: 0 }, global })
    expect(Number(full.get('[data-testid=countdown-ring]').attributes('stroke-dashoffset'))).toBe(0)
    expect(
      Number(empty.get('[data-testid=countdown-ring]').attributes('stroke-dashoffset')),
    ).toBeGreaterThan(200)
  })
})

describe('ChoiceButton', () => {
  it('tıklanınca choose yayar; disabled iken yaymaz', async () => {
    const wrapper = mount(ChoiceButton, { props: { text: 'A', index: 0, state: 'idle' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('choose')).toHaveLength(1)

    await wrapper.setProps({ disabled: true })
    await wrapper.trigger('click')
    expect(wrapper.emitted('choose')).toHaveLength(1)
  })
})

describe('QuestionCard', () => {
  const question = {
    position: 0,
    total: 20,
    question_id: 1,
    text: 'Soru?',
    choices: [
      { id: 11, text: 'A' },
      { id: 12, text: 'B' },
      { id: 13, text: 'C' },
      { id: 14, text: 'D' },
    ],
    time_limit_seconds: 5,
    served_at: '2026-10-01T10:00:00Z',
    remaining_seconds: 5,
  }

  it('geri bildirimde doğru seçeneği yeşil, yanlış seçileni kırmızı gösterir', () => {
    const wrapper = mount(QuestionCard, {
      props: {
        question,
        selectedChoiceId: 12,
        locked: true,
        feedback: {
          is_correct: false,
          correct_choice_id: 14,
          points: 0,
          is_last: false,
          score_so_far: 0,
        },
      },
    })
    const states = wrapper.findAll('[data-testid=choice]').map((b) => b.attributes('data-state'))
    expect(states).toEqual(['dimmed', 'wrong', 'dimmed', 'correct'])
  })

  it('seçeneğe tıklanınca choice id ile choose yayar', async () => {
    const wrapper = mount(QuestionCard, {
      props: { question, selectedChoiceId: null, feedback: null, locked: false },
    })
    await wrapper.findAll('[data-testid=choice]')[2]!.trigger('click')
    expect(wrapper.emitted('choose')![0]).toEqual([13])
  })
})

describe('NameForm', () => {
  it('geçersiz isimde submit yaymaz ve hata gösterir', async () => {
    const wrapper = mount(NameForm, { global })
    await wrapper.get('[data-testid=name-input]').setValue('A')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('[role=alert]').text()).toContain('en az 2')
  })

  it('geçerli ismi kırpılmış ve normalize edilmiş olarak yayar (Türkçe karakterler dahil)', async () => {
    const wrapper = mount(NameForm, { global })
    await wrapper.get('[data-testid=name-input]').setValue('  Ayşe   Çağla-1 ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')![0]).toEqual(['Ayşe Çağla-1'])
  })

  it('sunucu hatasını gösterir', () => {
    const wrapper = mount(NameForm, {
      global,
      props: { serverError: 'Bu isim kurallara uymuyor.' },
    })
    expect(wrapper.get('[role=alert]').text()).toBe('Bu isim kurallara uymuyor.')
  })

  it('kaydederken tekrar göndermeyi engeller', async () => {
    const wrapper = mount(NameForm, { global, props: { loading: true } })
    await wrapper.get('[data-testid=name-input]').setValue('Ayşe')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
